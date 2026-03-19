import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { User } from '../database/entities/user.entity';
import { SnapshotBuilderService } from './snapshot-builder.service';
import {
  AskAssistantDto,
  AskAssistantResponse,
  AssistantScope,
} from './dto/ask-assistant.dto';

const FALLBACK_MESSAGE =
  "Sorry, I didn't understand that. Please try rephrasing your question.";

@Injectable()
export class AssistantService {
  private openai: OpenAI | null = null;

  constructor(
    private snapshotBuilder: SnapshotBuilderService,
    private config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    }
  }

  async ask(
    dto: AskAssistantDto,
    user: User | null,
  ): Promise<AskAssistantResponse> {
    if (!user) {
      throw new UnauthorizedException(
        'Please sign in to use the AI assistant for your events.',
      );
    }

    const { snapshot, fallback } = await this.snapshotBuilder.buildSnapshot(
      user,
      dto.question,
      dto.eventId,
    );

    if (fallback) {
      return {
        answer: fallback,
        usedScope: 'personal',
        intent: 'fallback',
        referencedEventIds: [],
      };
    }

    if (!this.openai) {
      return {
        answer:
          'The AI assistant is not configured. Please set GROQ_API_KEY in the environment.',
        usedScope: 'personal',
        intent: snapshot.intent,
        referencedEventIds: snapshot.matchedEventDetails.map((e) => e.id),
        disclaimer: 'Groq API key is missing.',
      };
    }

    const prompt = this.buildPrompt(dto.question, snapshot);
    const model = this.config.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';

    console.log(prompt, model, 777);
    

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are a read-only event assistant. Answer ONLY from the provided JSON snapshot. Do not invent events, attendees, dates, tags, or locations. If data is missing, say so clearly. Never claim to create, update, delete, join, leave, or invite anyone. Keep answers short and factual. If the question is unclear or you cannot answer from the snapshot, respond with exactly: "${FALLBACK_MESSAGE}"`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
      });

      const raw = completion.choices[0]?.message?.content?.trim();
      const answer = raw ?? FALLBACK_MESSAGE;

      const scope: AssistantScope =
        snapshot.matchedEventDetails.length > 0 ? 'event-details' : 'personal';

      return {
        answer,
        usedScope: scope,
        intent: snapshot.intent,
        referencedEventIds: snapshot.matchedEventDetails.map((e) => e.id),
      };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Groq API request failed';
      return {
        answer: `Unable to process your question: ${msg}. Please try again.`,
        usedScope: 'personal',
        intent: snapshot.intent,
        referencedEventIds: [],
        disclaimer: 'The AI service encountered an error.',
      };
    }
  }

  private buildPrompt(question: string, snapshot: object): string {
    const safeSnapshot = JSON.stringify(snapshot, null, 0);
    return `Question: ${question}\n\nEvent data (JSON):\n${safeSnapshot}\n\nProvide a concise answer based only on the data above.`;
  }
}

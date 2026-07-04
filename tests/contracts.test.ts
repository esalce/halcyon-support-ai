import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ActionSchema, CustomerRecordSchema, TraceSchema } from '../src/types/index.js';

const FIXTURES_DIR = fileURLToPath(new URL('../fixtures', import.meta.url));

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('fixtures/customers.json', () => {
  const CustomersFileSchema = z.record(CustomerRecordSchema);
  const parseCustomers = () =>
    CustomersFileSchema.parse(readJson(join(FIXTURES_DIR, 'customers.json')));

  it('validates every record against CustomerRecordSchema', () => {
    const customers = parseCustomers();
    expect(Object.keys(customers)).toHaveLength(6);
  });

  it('contains the six personas from SPEC §3.5', () => {
    const customers = parseCustomers();
    expect(Object.keys(customers).sort()).toEqual([
      'plus-uk',
      'plus-us',
      'plus-us-open-ticket',
      'standard-uk',
      'standard-us',
      'suspended-us',
    ]);
    expect(customers['suspended-us']?.account_status).toBe('suspended');
    expect(customers['plus-us-open-ticket']?.open_ticket_id).not.toBeNull();
  });

  it('covers the boundary-relevant transaction shapes', () => {
    const customers = parseCustomers();
    const transactions = Object.values(customers).flatMap((c) => c.transactions);
    const productTypes = new Set(transactions.map((t) => t.product_type));
    expect(productTypes).toContain('wire_transfer');
    expect(productTypes).toContain('crypto');
    expect(productTypes).toContain('international_transfer');
    expect(transactions.some((t) => t.disputed)).toBe(true);
  });
});

describe('fixtures/traces/', () => {
  const traceDir = join(FIXTURES_DIR, 'traces');
  const traceFiles = readdirSync(traceDir).filter((f) => f.endsWith('.json'));
  const loadTrace = (file: string) => TraceSchema.parse(readJson(join(traceDir, file)));

  it('has the six sample traces', () => {
    expect(traceFiles).toHaveLength(6);
  });

  it.each(traceFiles)('%s validates against TraceSchema', (file) => {
    expect(() => loadTrace(file)).not.toThrow();
  });

  it('covers every Action value plus one outbox case', () => {
    const traces = traceFiles.map(loadTrace);
    const actions = new Set(traces.map((t) => t.action));
    for (const action of ActionSchema.options) {
      expect(actions).toContain(action);
    }
    expect(traces.filter((t) => t.action_detail.outbox?.queued)).toHaveLength(1);
  });

  it('keeps each trace internally coherent', () => {
    for (const file of traceFiles) {
      const trace = loadTrace(file);
      if (trace.routing === 'incident_fast_path') {
        expect(trace.classification).toBeNull();
        expect(trace.llm.calls).toBe(0);
        expect(trace.action).toBe('ROUTE_INCIDENT_MACRO');
      } else {
        expect(trace.classification).not.toBeNull();
        expect(trace.confidence.classification_confidence).toBe(
          trace.classification?.confidence,
        );
      }
      if (trace.action === 'ANSWER') {
        expect(trace.answer_served).not.toBeNull();
        expect(trace.kb?.chunks.length).toBeGreaterThan(0);
      }
      if (trace.action === 'ESCALATE_WITH_APPROVED_RESPONSE') {
        expect(trace.action_detail.template_id).toBeDefined();
        expect(trace.answer_served).not.toBeNull();
      }
      if (trace.action === 'ROUTE_INCIDENT_MACRO') {
        expect(trace.action_detail.macro_id).toBeDefined();
      }
    }
  });
});

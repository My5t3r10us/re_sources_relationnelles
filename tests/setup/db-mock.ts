/**
 * Helper to create a chainable, awaitable Drizzle ORM mock.
 *
 * Usage in test files:
 *
 *   let selectIdx = 0;
 *   let selectData: any[][] = [];
 *
 *   vi.mock('@/db', () => ({ db: buildDbMock(() => selectData, () => selectIdx, (n) => { selectIdx = n; }) }));
 *
 *   beforeEach(() => { selectIdx = 0; selectData = []; });
 */

export function makeChain(val: any[] = []): any {
  const chain: any = {
    from: (..._: any[]) => makeChain(val),
    where: (..._: any[]) => makeChain(val),
    limit: (..._: any[]) => makeChain(val),
    offset: (..._: any[]) => makeChain(val),
    orderBy: (..._: any[]) => makeChain(val),
    leftJoin: (..._: any[]) => makeChain(val),
    innerJoin: (..._: any[]) => makeChain(val),
    groupBy: (..._: any[]) => makeChain(val),
    set: (..._: any[]) => makeChain(val),
    values: (..._: any[]) => makeChain(val),
    returning: (..._: any[]) => Promise.resolve(val),
    then: (resolve: any, reject?: any) => Promise.resolve(val).then(resolve, reject),
    catch: (rej: any) => Promise.resolve(val).catch(rej),
    finally: (fn: any) => Promise.resolve(val).finally(fn),
  };
  return chain;
}

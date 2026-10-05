type ElementConstructor<T extends Element> = abstract new () => T;

export function getById<T extends HTMLElement>(id: string, type: ElementConstructor<T>): T {
  const element = document.getElementById(id);

  if (element instanceof type) return element;

  throw new Error(`Expected #${id} to be a ${type.name}`);
}

export function queryAll<T extends Element>(selector: string, type: ElementConstructor<T>): T[] {
  const matches: T[] = [];

  for (const element of document.querySelectorAll(selector)) {
    if (element instanceof type) matches.push(element);
  }

  return matches;
}

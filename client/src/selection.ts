/** What's highlighted in the list and on the map: a listed stop or a weather alert. */
export type Selection = { kind: 'stop' | 'alert'; index: number } | null;

export const isSelected = (sel: Selection, kind: 'stop' | 'alert', index: number) =>
  sel?.kind === kind && sel.index === index;

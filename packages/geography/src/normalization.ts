export function normalizePlaceName(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-CA").replace(/[‘’`´]/g,"'").replace(/\s+/g," ").replace(/\s*-\s*/g,"-");
}

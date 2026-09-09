/**
 * Papers (modules) often don't get a formal title until late in the
 * process, so the short (working) title is what people actually refer to
 * them by — prefer it everywhere a paper's name is displayed.
 */
export function paperDisplayTitle(paper: {
  shortTitle: string | null;
  title: string | null;
}): string {
  return paper.shortTitle?.trim() || paper.title?.trim() || "Untitled paper";
}

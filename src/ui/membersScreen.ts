import { div } from './components';
import { renderMembersForm, startEdit } from './membersForm';
import { renderMembersList } from './membersList';

let host: HTMLElement | null = null;

function repaint(): void {
  if (!host) return;
  host.replaceChildren(renderMembersList(startEdit), renderMembersForm(repaint));
}

export function renderMembers(): HTMLElement {
  host = div('space-y-4');
  repaint();
  return host;
}

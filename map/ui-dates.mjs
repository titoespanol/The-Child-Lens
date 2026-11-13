export function formatUiDate(value, includeTime = false) {
  if (value == null || value === '') return '';
  const input = String(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  if (includeTime) Object.assign(options, { hour: '2-digit', minute: '2-digit' });
  return new Intl.DateTimeFormat('en-GB', options).format(date);
}

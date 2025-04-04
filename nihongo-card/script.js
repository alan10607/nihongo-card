let text = `

`;

text = text
  .replaceAll('（', '(')
  .replaceAll('）', ')')
  .replaceAll('＜', '<')
  .replaceAll('＞', '>')
  .replaceAll('［', '[')
  .replaceAll('］', ']')
  .replaceAll('？', '?')
  .replaceAll('：', ':')
  .replaceAll('　', ' ')
  .replaceAll('／', '/')
  .replaceAll('！', '!')
  .replaceAll('，', ',')
  .replaceAll('＝', '=')
  .replaceAll('｜', '|')
  .replaceAll('～', '~')
  .replaceAll(' ', '');

console.dir(text);
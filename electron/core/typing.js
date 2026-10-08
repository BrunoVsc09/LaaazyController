// Comando de PowerShell que digita um texto no programa da frente. Sem I/O.
//
// Segurança: o texto vai em base64 e é decodificado dentro do PowerShell. Nada do que
// foi digitado entra cru no comando, então nenhum texto consegue virar um comando.
// Caracteres comuns vão por SendKeys (com + ^ % ~ ( ) { } [ ] protegidos); acentos e
// outros fora do ASCII são colados um a um, e a área de transferência antiga volta no fim.
// Precisa de $w = WScript.Shell já criado (adapters/ps-keys).
const MAX = 500
const CONTROL = /[\u0000-\u001f\u007f]/

function typeCommand(text) {
  if (typeof text !== 'string' || !text || text.length > MAX || CONTROL.test(text)) return null
  const b64 = Buffer.from(text, 'utf8').toString('base64')
  return [
    `$t=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${b64}'))`,
    '$o=Get-Clipboard -Raw -ErrorAction SilentlyContinue',
    'foreach($c in $t.ToCharArray()){' +
      "if([int]$c -lt 128){$w.SendKeys(($c.ToString() -replace '([+^%~(){}\\[\\]])','{$1}'))}" +
      "else{Set-Clipboard -Value $c.ToString();Start-Sleep -Milliseconds 40;$w.SendKeys('^v');Start-Sleep -Milliseconds 40}" +
    '}',
    'if($o){Set-Clipboard -Value $o}',
  ].join(';')
}

const isCount = (n, min) => n === undefined || (Number.isInteger(n) && n >= min && n <= MAX)

// Uma tecla do teclado por cima vira { move, back, text, enter }: anda com o cursor (L1/R1),
// apaga N, digita o texto e aperta Enter (R2), nessa ordem. Tudo opcional.
function validEdit(e) {
  if (!e || typeof e !== 'object') return false
  const { move, back, text, enter } = e
  return isCount(move, -MAX) && isCount(back, 0) &&
    (text === undefined || (typeof text === 'string' && text.length <= MAX && !CONTROL.test(text))) &&
    (enter === undefined || typeof enter === 'boolean')
}

// Comando que aplica a edição no campo do programa da frente; null se não há o que fazer
function editCommand(e) {
  if (!validEdit(e)) return null
  const { move = 0, back = 0, text = '', enter = false } = e
  const keys = (k) => `$w.SendKeys('{${k}}')`
  const parts = [
    move ? keys(`${move < 0 ? 'LEFT' : 'RIGHT'} ${Math.abs(move)}`) : '',
    back ? keys(`BACKSPACE ${back}`) : '',
    text ? typeCommand(text) : '',
    enter ? keys('ENTER') : '',
  ].filter(Boolean)
  return parts.length ? parts.join(';') : null
}

module.exports = { typeCommand, validEdit, editCommand, MAX }

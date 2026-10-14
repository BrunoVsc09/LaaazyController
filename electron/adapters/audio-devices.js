// Saídas de som do Windows: lista as ativas e troca a saída padrão. PowerShell com C# (Core Audio),
// sem instalar nada. O Windows não tem forma oficial de trocar a saída padrão: IPolicyConfig é a
// interface interna que SoundSwitch e EarTrumpet usam (pode mudar numa atualização do Windows).
const { spawn } = require('child_process')

const CSHARP = `
using System;
using System.Text;
using System.Runtime.InteropServices;
namespace LaaazyAudio {
  [StructLayout(LayoutKind.Sequential)] public struct PropKey { public Guid fmtid; public int pid; }
  [StructLayout(LayoutKind.Explicit)] public struct PropVar { [FieldOffset(0)] public ushort vt; [FieldOffset(8)] public IntPtr ptr; [FieldOffset(8)] public long pad; }
  [ComImport, Guid("886d8eeb-8cf2-4446-8d02-cdba1dbdcf99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IPropertyStore { int GetCount(out int c); int GetAt(int i, out PropKey k); int GetValue(ref PropKey k, out PropVar v); }
  [ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IMMDevice { int Activate(ref Guid iid, int ctx, IntPtr p, [MarshalAs(UnmanagedType.IUnknown)] out object o); int OpenPropertyStore(int access, out IPropertyStore s); int GetId([MarshalAs(UnmanagedType.LPWStr)] out string id); int GetState(out int st); }
  [ComImport, Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IMMDeviceCollection { int GetCount(out int n); int Item(int i, out IMMDevice d); }
  [ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IMMDeviceEnumerator { int EnumAudioEndpoints(int flow, int mask, out IMMDeviceCollection c); int GetDefaultAudioEndpoint(int flow, int role, out IMMDevice d); }
  [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumerator { }
  [ComImport, Guid("f8679f50-850a-41cf-9c72-430f290290c8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IPolicyConfig {
    int GetMixFormat(); int GetDeviceFormat(); int ResetDeviceFormat(); int SetDeviceFormat(); int GetProcessingPeriod();
    int SetProcessingPeriod(); int GetShareMode(); int SetShareMode(); int GetPropertyValue(); int SetPropertyValue();
    int SetDefaultEndpoint([MarshalAs(UnmanagedType.LPWStr)] string id, int role);
  }
  [ComImport, Guid("870af99c-171d-4f9e-af0d-e63df40c2bc9")] class PolicyConfigClient { }
  public static class Outputs {
    // id <tab> nome <tab> 1 se for a padrão; só as saídas ativas (render, DEVICE_STATE_ACTIVE)
    public static string List() {
      var e = (IMMDeviceEnumerator)new MMDeviceEnumerator();
      IMMDevice def; string defId = "";
      if (e.GetDefaultAudioEndpoint(0, 0, out def) == 0) def.GetId(out defId);
      IMMDeviceCollection c; Marshal.ThrowExceptionForHR(e.EnumAudioEndpoints(0, 1, out c));
      int n; c.GetCount(out n);
      var key = new PropKey { fmtid = new Guid("a45c254e-df1c-4efd-8020-67d146a850e0"), pid = 14 };
      var sb = new StringBuilder();
      for (int i = 0; i < n; i++) {
        IMMDevice d; c.Item(i, out d); string id; d.GetId(out id);
        IPropertyStore s; d.OpenPropertyStore(0, out s); PropVar v; s.GetValue(ref key, out v);
        string name = v.vt == 31 ? Marshal.PtrToStringUni(v.ptr) : id;
        sb.Append(id).Append('\\t').Append(name.Replace('\\t', ' ')).Append('\\t').Append(id == defId ? "1" : "0").Append('\\n');
      }
      return sb.ToString();
    }
    // Padrão para os três papéis (console, multimídia, comunicação), como no painel de Som
    public static int SetDefault(string id) {
      var p = (IPolicyConfig)new PolicyConfigClient(); int hr = 0;
      for (int role = 0; role < 3; role++) { int r = p.SetDefaultEndpoint(id, role); if (r != 0) hr = r; }
      return hr;
    }
  }
}
`

const SETUP = `[Console]::OutputEncoding = [Text.Encoding]::UTF8\nAdd-Type -TypeDefinition @'\n${CSHARP}\n'@\n`
const ID = /^\{[0-9.]+\}\.\{[0-9a-fA-F-]{36}\}$/

const listScript = () => `${SETUP}[LaaazyAudio.Outputs]::List()\n`
const setScript = (id) => (typeof id === 'string' && ID.test(id) ? `${SETUP}exit [LaaazyAudio.Outputs]::SetDefault('${id}')\n` : null)

// Roda o script num PowerShell escondido; { code, out } no fim (code -1 = não abriu ou demorou).
// -EncodedCommand (UTF-16 em base64): o "-Command -" lê linha por linha e ignora o bloco do C#
function run(script) {
  return new Promise((res) => {
    let out = ''
    let ps
    const encoded = Buffer.from(script, 'utf16le').toString('base64')
    try {
      ps = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], { windowsHide: true })
    } catch { return res({ code: -1, out: '' }) }
    const timer = setTimeout(() => { ps.kill(); res({ code: -1, out }) }, 20000)
    ps.stdout.setEncoding('utf8')
    ps.stdout.on('data', (d) => { out += d })
    ps.on('error', () => { clearTimeout(timer); res({ code: -1, out }) })
    ps.on('close', (code) => { clearTimeout(timer); res({ code: code ?? -1, out }) })
  })
}

async function listOutputs() {
  const r = await run(listScript())
  return r.code === 0 ? { ok: true, text: r.out } : { ok: false, code: r.code }
}

async function setDefaultOutput(id) {
  const script = setScript(id)
  if (!script) return { ok: false, code: 'ID' }
  const r = await run(script)
  return r.code === 0 ? { ok: true } : { ok: false, code: r.code }
}

module.exports = { listScript, setScript, listOutputs, setDefaultOutput }

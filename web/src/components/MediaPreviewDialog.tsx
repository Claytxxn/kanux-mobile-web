"use client";

interface MediaPreviewDialogProps {
  open: boolean;
  type: "image" | "document";
  url: string | null;
  name?: string | null;
  onClose: () => void;
}

export default function MediaPreviewDialog({ open, type, url, name, onClose }: MediaPreviewDialogProps) {
  if (!open || !url) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-4" onClick={onClose}>
      <div
        className="w-full max-w-5xl rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">{name || (type === "image" ? "Imagem" : "Documento")}</p>
            <p className="text-xs text-slate-400">
              {type === "image" ? "Visualização ampliada" : "Abra o arquivo no navegador para baixar ou visualizar"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5"
          >
            Fechar
          </button>
        </div>

        <div className="p-5">
          {type === "image" ? (
            <div className="flex max-h-[75vh] items-center justify-center overflow-hidden rounded-2xl bg-black/50">
              <img src={url} alt={name || "Imagem"} className="max-h-[75vh] w-auto max-w-full object-contain" />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-cyan-500/30 bg-slate-950/50 p-8 text-center">
              <p className="mb-2 text-lg font-semibold text-white">{name || "Documento"}</p>
              <p className="text-sm text-slate-400">O navegador abrirá o arquivo em outra aba.</p>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              {type === "image" ? "Abrir original" : "Abrir arquivo"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
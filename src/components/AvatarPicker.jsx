// components/AvatarPicker.jsx
import { useRef, useState } from "react";
import { uploadProfileImage } from "../util/uploadProfileImage";
import { Upload, User2 } from "lucide-react";

export default function AvatarPicker({ value, onChange, disabled }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(value || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const openPicker = () => inputRef.current?.click();
  const handleError = () => setPreview("");

  const handleSelect = async (e) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setError("");
    try {
      setBusy(true);
      // optimistic local preview
      const local = URL.createObjectURL(file);
      setPreview(local);

      // unsigned Cloudinary upload (frontend-only)
      const { url } = await uploadProfileImage(file);

      setPreview(url);
      onChange?.(url);
    } catch (err) {
      setError(err?.message || "Upload failed");
      if (!value) setPreview("");
      else setPreview(value);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleSelect}
        className="hidden"
        disabled={disabled || busy}
      />

      {/* Avatar circle */}
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled || busy}
        className="relative h-20 w-20 rounded-full outline-none ring-1 ring-indigo-200/60 hover:ring-indigo-300 transition disabled:opacity-60"
        aria-label="Upload avatar"
      >
        {/* Background tint */}
        <div className="absolute inset-0 rounded-full bg-indigo-500/10" />

        {preview ? (
          <img
            src={preview}
            onError={handleError}
            alt="avatar"
            className="absolute inset-0 h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-indigo-600">
            <User2 size={28} />
          </div>
        )}

        {/* Spinner overlay */}
        {busy && (
          <div className="absolute inset-0 grid place-items-center rounded-full bg-white/50">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          </div>
        )}

        {/* Corner upload badge */}
        <div className="pointer-events-none absolute -bottom-1 -right-1 rounded-full bg-white shadow ring-1 ring-black/5">
          <div className="m-1 grid h-6 w-6 place-items-center rounded-full bg-indigo-600 text-white">
            <Upload size={14} />
          </div>
        </div>
      </button>

      {/* Improved button */}
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled || busy}
        className="inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm text-gray-800 hover:bg-indigo-50 hover:border-indigo-300 transition disabled:opacity-60"
      >
        <Upload size={16} className="text-indigo-600" />
        {busy ? "Uploading…" : "Upload photo"}
      </button>
    </div>
  );
}

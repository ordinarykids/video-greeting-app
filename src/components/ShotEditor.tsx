"use client";

import { useState } from "react";
import {
  Clock,
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Video,
} from "lucide-react";
import {
  type Shot,
  CAMERA_OPTIONS,
  CAMERA_LABELS,
  rebuildShot,
} from "@/lib/shots";

interface ShotEditorProps {
  shots: Shot[];
  onChange: (shots: Shot[]) => void;
}

export default function ShotEditor({ shots, onChange }: ShotEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editCamera, setEditCamera] = useState(0);

  const totalDuration = shots.reduce((sum, s) => sum + s.estimatedSeconds, 0);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditText(shots[index].text);
    const camIdx = CAMERA_OPTIONS.indexOf(shots[index].camera);
    setEditCamera(camIdx >= 0 ? camIdx : 0);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const text = editText.trim();
    if (!text) return;

    const updated = shots.map((s, i) => {
      if (i !== editingIndex) return { ...s, index: i };
      return rebuildShot(text, i, CAMERA_OPTIONS[editCamera]);
    });
    onChange(updated);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  const deleteShot = (index: number) => {
    if (shots.length <= 1) return;
    const updated = shots
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, index: i }));
    onChange(updated);
    if (editingIndex === index) setEditingIndex(null);
  };

  const addShot = (afterIndex: number) => {
    const newShot = rebuildShot("", afterIndex + 1);
    const updated = [
      ...shots.slice(0, afterIndex + 1),
      newShot,
      ...shots.slice(afterIndex + 1),
    ].map((s, i) => ({ ...s, index: i }));
    onChange(updated);
    // Immediately open editing on the new shot
    setEditingIndex(afterIndex + 1);
    setEditText("");
    const camIdx = CAMERA_OPTIONS.indexOf(newShot.camera);
    setEditCamera(camIdx >= 0 ? camIdx : 0);
  };

  const moveShot = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= shots.length) return;
    const updated = [...shots];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated.map((s, i) => ({ ...s, index: i })));
    if (editingIndex === index) setEditingIndex(target);
    else if (editingIndex === target) setEditingIndex(index);
  };

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5 text-gray-600" />
          <span className="font-medium text-gray-900">
            {shots.length} shot{shots.length !== 1 ? "s" : ""}
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            ~{totalDuration}s total
          </span>
        </div>
        <button
          type="button"
          onClick={() => addShot(shots.length - 1)}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          <Plus className="h-4 w-4" />
          Add Shot
        </button>
      </div>

      {/* Shot list */}
      <div className="space-y-2">
        {shots.map((shot, i) => {
          const isEditing = editingIndex === i;
          const isOvertime = shot.estimatedSeconds > 8;
          const isEmpty = !shot.text.trim();

          return (
            <div key={i}>
              <div
                className={`border rounded-lg transition-all ${
                  isEditing
                    ? "border-gray-900 ring-1 ring-gray-900"
                    : isEmpty
                      ? "border-red-200 bg-red-50/50"
                      : isOvertime
                        ? "border-amber-200"
                        : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {isEditing ? (
                  /* ---- Edit mode ---- */
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-7 w-7 rounded-full bg-gray-900 text-white text-xs items-center justify-center font-medium">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        Editing Shot {i + 1}
                      </span>
                    </div>

                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                      placeholder="Enter the dialogue for this shot..."
                      autoFocus
                    />

                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      ~{editText.trim() ? rebuildShot(editText.trim(), 0).estimatedSeconds : 0}s estimated
                      {editText.trim() && rebuildShot(editText.trim(), 0).estimatedSeconds > 8 && (
                        <span className="text-amber-600 flex items-center gap-1 ml-2">
                          <AlertTriangle className="h-3 w-3" />
                          Over 8s - consider splitting
                        </span>
                      )}
                    </div>

                    {/* Camera select */}
                    <div className="mt-3">
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Camera Angle
                      </label>
                      <select
                        value={editCamera}
                        onChange={(e) => setEditCamera(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                      >
                        {CAMERA_LABELS.map((label, ci) => (
                          <option key={ci} value={ci}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Save / Cancel */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={!editText.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1.5 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ---- Display mode ---- */
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Reorder arrows + shot number */}
                      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => moveShot(i, "up")}
                          disabled={i === 0}
                          className="text-gray-300 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                          title="Move up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <span className="flex h-7 w-7 rounded-full bg-gray-900 text-white text-xs items-center justify-center font-medium">
                          {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => moveShot(i, "down")}
                          disabled={i === shots.length - 1}
                          className="text-gray-300 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                          title="Move down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Shot content */}
                      <div className="flex-1 min-w-0">
                        {isEmpty ? (
                          <p className="text-sm text-red-400 italic">
                            Empty shot - click edit to add dialogue
                          </p>
                        ) : (
                          <p className="text-gray-900 text-sm leading-relaxed">
                            &quot;{shot.text}&quot;
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span
                            className={`text-xs flex items-center gap-1 ${
                              isOvertime ? "text-amber-600" : "text-gray-400"
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            ~{shot.estimatedSeconds}s
                            {isOvertime && (
                              <AlertTriangle className="h-3 w-3 ml-0.5" />
                            )}
                          </span>
                          <span className="text-xs text-gray-400">
                            {CAMERA_LABELS[CAMERA_OPTIONS.indexOf(shot.camera)] ||
                              shot.camera.split(",")[0]}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(i)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          title="Edit shot"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteShot(i)}
                          disabled={shots.length <= 1}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete shot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Insert shot button between shots */}
              {i < shots.length - 1 && (
                <div className="flex justify-center py-1">
                  <button
                    type="button"
                    onClick={() => addShot(i)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-0.5 rounded hover:bg-gray-50"
                    title="Insert shot here"
                  >
                    <Plus className="h-3 w-3" />
                    Insert
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

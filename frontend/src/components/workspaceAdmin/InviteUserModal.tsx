import { useState } from "react";
import Button from "../common/Button";
import Input from "../common/Input";
import { inviteWorkspaceUser } from "../../services/workspaceServices";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InviteUserModal = ({ isOpen, onClose, onSuccess }: InviteUserModalProps) => {
  const [email, setEmail] = useState("");
  const [invitedName, setInvitedName] = useState("");
  const [role, setRole] = useState("member");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await inviteWorkspaceUser({ email, invitedName, role });
      onSuccess();
      onClose();
      setEmail("");
      setInvitedName("");
      setRole("member");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to invite user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">Assign User</h2>
        <p className="mt-1 text-sm text-gray-500 mb-6">
          Invite a new user to your workspace.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
            <Input
              placeHolder="User's name"
              value={invitedName}
              onChange={(e) => setInvitedName(e.target.value)}
              required={true}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Address</label>
            <Input
              type="email"
              placeHolder="User's email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={true}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="member">Member</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <Button
              label="Send Invitation"
              buttonType="submit"
              loading={isLoading}
              disabled={isLoading || !email || !invitedName}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteUserModal;

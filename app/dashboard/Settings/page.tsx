"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { useState } from "react";
import { toast } from "sonner";

const SettingsPage = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState("");

  const isPasswordStrong = (password: string) => {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setHasError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    if (!isPasswordStrong(newPassword)) {
      setHasError(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial."
      );
      return;
    }

    setIsLoading(true);
    setHasError("");

    const auth = getAuth();
    const user = auth.currentUser;

    if (user && user.email) {
      const credential = EmailAuthProvider.credential(user.email, oldPassword);

      try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        toast.success("Mot de passe mis à jour avec succès.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (error) {
        console.error("Error updating password:", error);
        setHasError("L'ancien mot de passe est incorrect.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 mt-[-10vh]">
      <h1 className="mb-6 text-3xl font-extrabold text-gray-800">
        Changer le mot de passe
      </h1>
      <div className="w-full max-w-lg p-6 space-y-6 bg-white rounded-lg shadow-lg">
        <Input
          type="password"
          placeholder="Ancien mot de passe"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
        <Input
          type="password"
          placeholder="Nouveau mot de passe"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
        <Input
          type="password"
          placeholder="Confirmer le nouveau mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
        {hasError && <p className="font-medium text-red-600">{hasError}</p>}
        <Button
          variant="default"
          size="lg"
          onClick={handleChangePassword}
          disabled={isLoading}
          className={`w-full py-3 transition-transform duration-300 ${
            isLoading
              ? "scale-95 bg-gray-400"
              : "hover:scale-105 bg-blue-600 text-white"
          }`}
        >
          {isLoading ? "Chargement..." : "Changer le mot de passe"}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;

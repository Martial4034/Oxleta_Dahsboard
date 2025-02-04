"use client";

import { Eye, Loader2, Search, SquarePlus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ImageFormat = "1:1" | "16:9" | "9:16" | "3:9" | "9:3";

interface ClientData {
  id: string;
  name: string;
  createdAt: Date;
  formats: {
    "1:1": boolean;
    "16:9": boolean;
    "9:16": boolean;
    "3:9": boolean;
    "9:3": boolean;
  };
}

export default function ClientPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ImageFormat | null>(
    null
  );
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    clientId: string;
    clientName: string;
  } | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [uploadingFormat, setUploadingFormat] = useState<{
    clientId: string;
    format: ImageFormat;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [replaceConfirmation, setReplaceConfirmation] = useState<{
    isOpen: boolean;
    client: ClientData;
    format: ImageFormat;
    file: File;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    format: string;
  } | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error("Please enter a client name");
      return;
    }

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: clientName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to add client");
        return;
      }

      toast.success("Client added successfully");
      setIsModalOpen(false);
      setClientName("");
      fetchClients();
    } catch (error) {
      console.error("Error adding client:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add client"
      );
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();

      const formattedClients = data.clients.map((client: any) => ({
        ...client,
        createdAt: new Date(client.createdAt),
      }));

      setClients(formattedClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadClick = async (client: ClientData, format: ImageFormat) => {
    setSelectedFormat(format);
    setSelectedClient(client);
    setIsUploadModalOpen(true);
  };

  const handleUploadConfirm = async () => {
    if (!selectedFile || !selectedClient || !selectedFormat) return;

    if (selectedClient.formats[selectedFormat]) {
      setReplaceConfirmation({
        isOpen: true,
        client: selectedClient,
        format: selectedFormat,
        file: selectedFile,
      });
      return;
    }

    await uploadImage(selectedClient, selectedFormat, selectedFile);
  };

  const uploadImage = async (
    client: ClientData,
    format: ImageFormat,
    file: File
  ) => {
    try {
      setIsUploading(true);
      setProgress(0);
      setUploadingFormat({
        clientId: client.id,
        format: format,
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("clientName", client.name);
      formData.append("format", format);

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setProgress(percentComplete);
        }
      };

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            reject(new Error("Upload failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));

        xhr.open("POST", "/api/upload_client");
        xhr.send(formData);
      });

      toast.success(`Image uploaded for format ${format}`);
      await fetchClients();
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setSelectedFormat(null);
      setSelectedClient(null);
      setReplaceConfirmation(null);
    } catch (error) {
      console.error("Error during upload:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      setUploadingFormat(null);
      setProgress(0);
    }
  };

  const handleDeleteClient = (clientId: string, clientName: string) => {
    setDeleteConfirmation({ isOpen: true, clientId, clientName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    let progressInterval: NodeJS.Timeout | undefined = undefined;

    try {
      setDeletingClientId(deleteConfirmation.clientId);
      setIsDeleting(true);
      setProgress(0);

      // Démarrer la progression simulée plus lentement
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return prev;
          }
          return prev + 5; // Augmenter de 5% au lieu de 10%
        });
      }, 200);

      // Attendre un peu avant de lancer la requête pour voir la progression
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await fetch(
        `/api/delete-client?clientId=${deleteConfirmation.clientId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete client");
      }

      // Compléter la barre de progression
      setProgress(100);
      if (progressInterval) clearInterval(progressInterval);

      toast.success("Client deleted successfully");
      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setDeletingClientId(null);
      setDeleteConfirmation(null);
      setIsDeleting(false);
      setProgress(0);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fonction pour prévisualiser l'image
  const handlePreviewClick = async (clientName: string, format: string) => {
    try {
      const extensions = [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "JPG",
        "JPEG",
        "PNG",
        "WEBP",
        "svg",
        "SVG",
      ];
      let publicUrl = null;

      // Essayer chaque extension jusqu'à ce qu'une image soit trouvée
      for (const ext of extensions) {
        const fileRef = `client/${clientName}/${format}/${format}.${ext}`;
        try {
          const response = await fetch("/api/make-public", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imagePath: fileRef }),
          });

          if (response.ok) {
            const data = await response.json();
            publicUrl = data.publicUrl;
            break; // Sortir de la boucle si une image est trouvée
          }
        } catch {
          continue; // Continuer avec la prochaine extension si celle-ci échoue
        }
      }

      if (!publicUrl) {
        throw new Error("No image found with any supported extension");
      }

      setPreviewImage({ url: publicUrl, format });
    } catch (error) {
      console.error("Error loading preview:", error);
      toast.error("Failed to load image preview");
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] overflow-y-auto bg-gray-100">
      <div className="p-4 mx-auto max-w-7xl md:p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Client Management
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 text-white transition-colors rounded-md bg-primary hover:bg-primary/90"
            >
              <SquarePlus className="mr-2" />
              Add Client
            </button>
          </div>
        </div>

        {/* Liste des clients */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="p-6 bg-white border rounded-lg shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{client.name}</h3>
                <button
                  onClick={() => handleDeleteClient(client.id, client.name)}
                  className="p-2 text-red-600 transition-colors rounded-md hover:bg-red-50 disabled:opacity-50"
                  disabled={deletingClientId === client.id}
                  title="Delete client"
                >
                  {deletingClientId === client.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="space-y-4">
                {(["1:1", "16:9", "9:16", "3:9", "9:3"] as ImageFormat[]).map(
                  (format) => (
                    <div
                      key={format}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600">
                        {format}
                        {client.formats[format] && (
                          <span className="ml-2 text-green-500">✓</span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {client.formats[format] && (
                          <button
                            onClick={() =>
                              handlePreviewClick(client.name, format)
                            }
                            className="p-2 text-blue-600 transition-colors rounded-md hover:bg-blue-50"
                            title="Preview image"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleUploadClick(client, format)}
                          disabled={
                            isUploading ||
                            (uploadingFormat?.clientId === client.id &&
                              uploadingFormat?.format === format)
                          }
                          className="flex items-center gap-2 px-3 py-1 text-sm text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {uploadingFormat?.clientId === client.id &&
                          uploadingFormat?.format === format ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>Upload Image</>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            {searchQuery
              ? "No clients found matching your search"
              : "No clients added yet"}
          </div>
        )}

        {/* Modal d'upload d'image */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="p-6 bg-white rounded-lg w-96">
              <h2 className="mb-4 text-xl font-semibold">
                Upload Image - {selectedFormat}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Select Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full mt-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    disabled={isUploading}
                  />
                </div>
                {isUploading && (
                  <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
                    <div
                      className="h-full transition-all duration-300 bg-blue-600"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setSelectedFile(null);
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadConfirm}
                    disabled={!selectedFile || isUploading}
                    className="relative px-4 py-2 text-white transition-colors rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      "Upload"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'ajout de client */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="p-6 bg-white rounded-lg w-96">
              <h2 className="mb-4 text-xl font-semibold">Add New Client</h2>
              <form onSubmit={handleAddClient} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white rounded-md bg-primary hover:bg-primary/90"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="p-6 bg-white rounded-lg w-96">
              <h2 className="mb-4 text-xl font-semibold">Confirm Deletion</h2>
              <p className="mb-6 text-gray-600">
                Etes-vous sur de vouloir supprimer{" "}
                {deleteConfirmation.clientName} ? Cette action ne peut pas être
                annulée et supprimera toutes les images associées.
              </p>
              {isDeleting && (
                <div className="w-full h-2 mb-4 overflow-hidden bg-gray-200 rounded-full">
                  <div
                    className="h-full transition-all duration-300 bg-red-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="relative px-4 py-2 text-white transition-colors bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {replaceConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="p-6 bg-white rounded-lg w-96">
              <h2 className="mb-4 text-xl font-semibold">
                Replace Existing Image
              </h2>
              <p className="mb-6 text-gray-600">
                An image already exists for the format{" "}
                {replaceConfirmation.format}. Are you sure you want to replace
                it?
              </p>
              {isUploading && (
                <div className="w-full h-2 mb-4 overflow-hidden bg-gray-200 rounded-full">
                  <div
                    className="h-full transition-all duration-300 bg-blue-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setReplaceConfirmation(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (replaceConfirmation) {
                      uploadImage(
                        replaceConfirmation.client,
                        replaceConfirmation.format,
                        replaceConfirmation.file
                      );
                    }
                  }}
                  className="relative px-4 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Replacing...</span>
                    </div>
                  ) : (
                    "Replace"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de prévisualisation */}
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative max-w-4xl p-4 bg-white rounded-lg">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute p-2 text-gray-500 hover:text-gray-700 top-2 right-2"
              >
                ✕
              </button>
              <h3 className="mb-4 text-lg font-semibold">
                Format: {previewImage.format}
              </h3>
              <img
                src={previewImage.url}
                alt={`Format ${previewImage.format}`}
                className="max-h-[80vh] w-auto"
                onError={() => {
                  setPreviewImage(null);
                  toast.error("Failed to load image");
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import "@/app/globals.css";
import imageCompression from "browser-image-compression";
import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import Calendar from "react-calendar";
import { toast } from "sonner";
import {
  OfferType,
  POSITION_FORMATS,
  PositionCode,
  POSITIONS,
} from "../../api/components/pubInfo";

export interface ImageData {
  id: string;
  imageUrl: string;
  publicUrl: string;
  offerType: OfferType;
  position: PositionCode;
  weekNumber: number;
  createdAt: Date;
  selectedFile?: File;
  company_name: string;
  country: string;
  format: string;
}

interface Client {
  id: string;
  name: string;
  formats: Record<string, boolean>;
}

interface MissingFormat {
  format: string;
  position: string;
}

// Ajout d'une interface pour les offres réservées
interface ReservedOffer {
  offerType: OfferType;
  company_name: string;
}

export default function PubPage() {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [imageData, setImageData] = useState<
    Omit<ImageData, "id" | "createdAt">
  >({
    imageUrl: "",
    publicUrl: "",
    offerType: "Premium 1",
    position: "P-1-1-1",
    weekNumber: 0,
    company_name: "",
    country: "ALL",
    format: POSITION_FORMATS["P-1-1-1"],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [selectedFormat] = useState<string | null>(null);
  const [isOfferTypeModalOpen, setIsOfferTypeModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedOfferType, setSelectedOfferType] =
    useState<OfferType>("Premium 1");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [missingFormats, setMissingFormats] = useState<MissingFormat[]>([]);
  const [isPartnerMode, setIsPartnerMode] = useState(false);
  const [reservedOffers, setReservedOffers] = useState<ReservedOffer[]>([]);

  const getCurrentWeek = () => {
    const today = new Date();
    const { monday } = getWeekDates(today);
    return getWeekNumber(monday);
  };

  useEffect(() => {
    const currentWeek = getCurrentWeek();
    setSelectedWeek(currentWeek);
    setImageData((prev) => ({
      ...prev,
      weekNumber: currentWeek,
    }));
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFormatModalOpen(false);
        setIsOfferTypeModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const getWeekDates = (date: Date) => {
    const currentDate = new Date(date);
    const day = currentDate.getDay();
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - day + (day === 0 ? -6 : 1));

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return { monday, sunday };
  };

  const handleDateSelect = (date: Date) => {
    const weekNum = getWeekNumber(date);
    setSelectedWeek(weekNum);
    setIsUploadModalOpen(true);
  };

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 1, // Taille maximale en MB
      maxWidthOrHeight: 1920, // Dimension maximale
      useWebWorker: true, // Utilise un Web Worker pour ne pas bloquer le thread principal
      fileType: "image/jpeg", // Format de sortie
    };

    try {
      const compressedFile = await imageCompression(file, options);
      console.log("Taille originale:", file.size / 1024 / 1024, "MB");
      console.log(
        "Taille compressée:",
        compressedFile.size / 1024 / 1024,
        "MB"
      );
      return compressedFile;
    } catch (error) {
      console.error("Erreur lors de la compression:", error);
      return file; // Retourne le fichier original en cas d'erreur
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      const compressedFile = await compressImage(file);
      setImageData((prev) => ({
        ...prev,
        selectedFile: compressedFile,
      }));

      toast.success(
        "Image selected and compressed. Click 'Save Image' to upload."
      );
    } catch (error) {
      console.error("Error handling file:", error);
      toast.error("Error processing image. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!imageData.selectedFile) {
        toast.error("Please select an image first");
        return;
      }

      if (!imageData.company_name) {
        toast.error("Please enter a company name");
        return;
      }

      if (!selectedWeek) {
        toast.error("Please select a week");
        return;
      }

      setIsUploading(true);
      setProgress(0);

      const formData = new FormData();
      const fileExtension = imageData.selectedFile.name.split(".").pop();
      const customFileName = `week-${selectedWeek}-${imageData.position}-${imageData.company_name}.${fileExtension}`;

      // Créer un nouveau fichier avec le nom personnalisé
      const renamedFile = new File([imageData.selectedFile], customFileName, {
        type: imageData.selectedFile.type,
      });

      formData.append("file", renamedFile);
      formData.append("country", "ALL");
      formData.append("weekNumber", selectedWeek.toString());

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? prev : prev + 5));
      }, 200);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Upload failed");
      }

      const { publicUrl } = await uploadResponse.json();

      // Sauvegarder dans Firestore
      const customDocId = `week-${selectedWeek}-${imageData.position}-${imageData.company_name}`;
      const saveResponse = await fetch("/api/game-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customDocId,
          imageData: {
            ...imageData,
            weekNumber: selectedWeek,
            imageUrl: publicUrl,
            publicUrl,
            createdAt: new Date().toISOString(),
          },
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || "Failed to save image data");
      }

      clearInterval(progressInterval);
      setProgress(100);

      toast.success("Image uploaded successfully");
      setIsUploadModalOpen(false);
      setImageData((prev) => ({
        ...prev,
        selectedFile: undefined,
        company_name: "",
      }));
    } catch (error) {
      console.error("Error during upload:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handlePositionChange = (position: PositionCode) => {
    setImageData((prev) => ({
      ...prev,
      position,
      format: POSITION_FORMATS[position],
    }));
  };

  const handleOfferTypeChange = (newOfferType: OfferType) => {
    // Vérifier si l'offre est déjà réservée
    if (isOfferReserved(newOfferType)) {
      const reservedBy = getReservedBy(newOfferType);
      toast.error(`This offer is already reserved by ${reservedBy}`);
      return;
    }

    const newPosition = POSITIONS[newOfferType][0];
    setImageData((prev) => ({
      ...prev,
      offerType: newOfferType,
      position: newPosition,
      format: POSITION_FORMATS[newPosition],
    }));
    setSelectedOfferType(newOfferType);
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month" && selectedWeek) {
      const currentDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison

      const { monday, sunday } = getWeekDates(today);
      const isInSelectedWeek = currentDate >= monday && currentDate <= sunday;
      const isToday = new Date().toDateString() === date.toDateString();
      const isSunday = date.getDay() === 0;
      const isSaturday = date.getDay() === 6;
      const isPastDate = currentDate < today;

      return `
        relative
        transition-all
        duration-200
        hover:bg-accent/80
        hover:text-accent-foreground
        focus:bg-accent
        focus:text-accent-foreground
        ${
          isInSelectedWeek
            ? "bg-primary/90 text-primary-foreground font-medium"
            : ""
        }
        ${isToday ? "bg-chart-1 text-white border-[#09090b]" : ""}
        ${
          isSunday || isPastDate
            ? "text-destructive/70 cursor-not-allowed hover:bg-destructive/10 hover:text-destructive"
            : ""
        }
        ${isSaturday ? "text-destructive/50" : ""}
        ${
          !isInSelectedWeek && !isSunday && !isPastDate ? "hover:scale-105" : ""
        }
      `.trim();
    }
    return "";
  };

  // Charger la liste des clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients");
        const data = await response.json();
        setClients(data.clients);
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load clients");
      }
    };
    fetchClients();
  }, []);

  // Fonction pour copier les images
  const handleAutomaticUpload = async () => {
    if (!selectedClient || !selectedWeek) {
      toast.error("Please select a client and week");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const positions = POSITIONS[selectedOfferType];
      let uploadedCount = 0;

      for (const position of positions) {
        const format = POSITION_FORMATS[position];

        // Vérifier si le format existe pour le client
        if (!selectedClient.formats[format]) {
          toast.error(
            `Missing format ${format} for client ${selectedClient.name}`
          );
          continue;
        }

        // Copier l'image
        const response = await fetch("/api/copy-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientName: selectedClient.name,
            format,
            weekNumber: selectedWeek,
            position,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to copy image for position ${position}`);
        }

        const { publicUrl } = await response.json();

        // Sauvegarder les informations dans Firestore
        const customDocId = `week-${selectedWeek}-${position}-ALL`;
        const saveResponse = await fetch("/api/game-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customDocId,
            imageData: {
              imageUrl: publicUrl,
              publicUrl,
              offerType: selectedOfferType,
              position,
              weekNumber: selectedWeek,
              company_name: selectedClient.name,
              country: "ALL",
              format,
            },
          }),
        });

        if (!saveResponse.ok) {
          throw new Error(`Failed to save image data for position ${position}`);
        }

        uploadedCount++;
        setProgress((uploadedCount / positions.length) * 100);
      }

      toast.success("Images uploaded successfully");
    } catch (error) {
      console.error("Error during automatic upload:", error);
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const checkMissingFormats = (
    client: Client,
    offerType: OfferType
  ): MissingFormat[] => {
    const positions = POSITIONS[offerType];
    const missing: MissingFormat[] = [];

    positions.forEach((position) => {
      const format = POSITION_FORMATS[position];
      if (!client.formats[format]) {
        missing.push({ format, position });
      }
    });

    return missing;
  };

  // Fonction pour récupérer les offres déjà réservées pour la semaine sélectionnée
  const fetchReservedOffers = async (weekNumber: number) => {
    try {
      const response = await fetch(`/api/offer-stats?weekNumber=${weekNumber}`);
      if (!response.ok) throw new Error("Failed to fetch reserved offers");
      const data = await response.json();

      const reserved: ReservedOffer[] = [];
      Object.entries(data).forEach(([offerType, info]: [string, any]) => {
        if (info.count > 0) {
          info.clients.forEach((client: string) => {
            reserved.push({
              offerType: offerType as OfferType,
              company_name: client,
            });
          });
        }
      });
      setReservedOffers(reserved);
    } catch (error) {
      console.error("Error fetching reserved offers:", error);
      toast.error("Failed to load reserved offers");
    }
  };

  // Mettre à jour useEffect pour charger les offres réservées
  useEffect(() => {
    if (selectedWeek) {
      fetchReservedOffers(selectedWeek);
    }
  }, [selectedWeek]);

  // Fonction pour vérifier si une offre est déjà réservée
  const isOfferReserved = (offerType: OfferType) => {
    return reservedOffers.some((offer) => offer.offerType === offerType);
  };

  // Fonction pour obtenir le nom du client qui a réservé l'offre
  const getReservedBy = (offerType: OfferType) => {
    const offer = reservedOffers.find((o) => o.offerType === offerType);
    return offer?.company_name;
  };

  return (
    <div className="h-[calc(100vh-80px)] overflow-y-auto bg-gray-100">
      <div className="max-w-4xl p-4 mx-auto md:p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Pub Management</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPartnerMode}
                onChange={(e) => {
                  setIsPartnerMode(e.target.checked);
                  if (e.target.checked) {
                    setSelectedClient(null);
                    setMissingFormats([]);
                  }
                }}
                className="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary"
              />
              Offre partenaire
            </label>
            <h2 className="p-2 text-lg font-semibold text-card-foreground">
              {selectedWeek
                ? `Images for Week ${selectedWeek}`
                : "Loading current week..."}
            </h2>
          </div>
        </div>

        <div className="space-y-6">
          {/* Calendrier */}
          <div className="overflow-hidden border shadow-sm bg-card rounded-xl">
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-card-foreground">
                Select Week
              </h2>
              <Calendar
                onChange={(value: any) => handleDateSelect(value as Date)}
                className="w-full border-none rounded-lg bg-card text-card-foreground [&_.react-calendar__month-view__weekdays]:mb-4 [&_.react-calendar__month-view__weekdays__weekday]:text-muted-foreground [&_.react-calendar__month-view__weekdays__weekday]:font-normal [&_.react-calendar__month-view__days__day]:h-10 [&_.react-calendar__month-view__days__day]:w-10 [&_.react-calendar__month-view__days__day]:rounded-md [&_.react-calendar__month-view__days__day]:my-1"
                tileClassName={tileClassName}
                calendarType="iso8601"
                tileDisabled={({ date, view }) => {
                  if (view === "month") {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date.getDay() === 0 || date < today;
                  }
                  return false;
                }}
              />
            </div>
          </div>

          {/* Modal d'upload */}
          {isUploadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-2xl p-6 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">
                    Add Images for Week {selectedWeek}
                  </h2>
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Condition pour afficher soit le mode partenaire, soit le mode normal */}
                {isPartnerMode ? (
                  <div className="space-y-6">
                    {/* Formulaire manuel complet */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Company Name & Offer Type */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={imageData.company_name}
                            onChange={(e) => {
                              const value = e.target.value.slice(0, 20);
                              setImageData((prev) => ({
                                ...prev,
                                company_name: value,
                              }));
                            }}
                            className="block w-full px-3 py-2 mt-1 border rounded-md shadow-sm bg-input text-input-foreground focus:border-ring focus:ring-ring"
                            placeholder="Enter company name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground">
                            Offer Type
                          </label>
                          <div className="flex items-center gap-4 mt-1">
                            <select
                              value={imageData.offerType}
                              onChange={(e) =>
                                handleOfferTypeChange(
                                  e.target.value as OfferType
                                )
                              }
                              className="flex-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-input text-input-foreground focus:border-ring focus:ring-ring"
                            >
                              {Object.keys(POSITIONS).map((offer) => (
                                <option key={offer} value={offer}>
                                  {offer}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setIsOfferTypeModalOpen(true)}
                              className="px-4 py-2 text-sm font-semibold text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Position & Upload */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground">
                            Position
                          </label>
                          <div className="flex items-center gap-4 mt-1">
                            <select
                              value={imageData.position}
                              onChange={(e) =>
                                handlePositionChange(
                                  e.target.value as PositionCode
                                )
                              }
                              className="flex-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-input text-input-foreground focus:border-ring focus:ring-ring"
                            >
                              {POSITIONS[imageData.offerType].map(
                                (position) => (
                                  <option key={position} value={position}>
                                    {position}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground">
                            Upload Image ({imageData.format})
                          </label>
                          <div className="mt-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none"
                              disabled={isUploading}
                            />
                            {isUploading && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                Uploading... {progress}%
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={
                        isUploading ||
                        !imageData.selectedFile ||
                        !imageData.company_name
                      }
                      className="w-full px-4 py-2 text-white transition-colors rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isUploading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <span>Uploading... {Math.round(progress)}%</span>
                        </div>
                      ) : (
                        "Save Image"
                      )}
                    </button>

                    {isUploading && (
                      <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
                        <div
                          className="h-full transition-all duration-300 bg-blue-600"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // Mode normal avec sélection de client
                  <>
                    {/* Sélection du client */}
                    <div className="mb-6">
                      <label className="block mb-2 text-sm font-medium">
                        Select Client
                      </label>
                      <select
                        value={selectedClient?.id || ""}
                        onChange={(e) => {
                          const client = clients.find(
                            (c) => c.id === e.target.value
                          );
                          setSelectedClient(client || null);
                          if (client) {
                            const missing = checkMissingFormats(
                              client,
                              selectedOfferType
                            );
                            setMissingFormats(missing);
                          }
                        }}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Select a client...</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sélection du type d'offre */}
                    <div className="mb-6">
                      <label className="block mb-2 text-sm font-medium">
                        Offer Type
                      </label>
                      <select
                        value={selectedOfferType}
                        onChange={(e) => {
                          const newType = e.target.value as OfferType;
                          handleOfferTypeChange(newType);
                          if (selectedClient) {
                            const missing = checkMissingFormats(
                              selectedClient,
                              newType
                            );
                            setMissingFormats(missing);
                          }
                        }}
                        className="w-full p-2 border rounded"
                      >
                        {Object.keys(POSITIONS).map((type) => {
                          const isReserved = isOfferReserved(type as OfferType);
                          const reservedBy = getReservedBy(type as OfferType);

                          return (
                            <option
                              key={type}
                              value={type}
                              disabled={isReserved}
                              className={isReserved ? "text-gray-400" : ""}
                            >
                              {type}{" "}
                              {isReserved ? `(Reserved by ${reservedBy})` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Affichage des formats manquants */}
                    {missingFormats.length > 0 && (
                      <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-lg">
                        <h3 className="mb-2 font-semibold">Missing Formats:</h3>
                        <ul className="ml-4 list-disc">
                          {missingFormats.map(({ format, position }) => (
                            <li key={position}>
                              Format {format} for position {position}
                            </li>
                          ))}
                        </ul>
                        <Link
                          href="/dashboard/client"
                          className="inline-block px-4 py-2 mt-4 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Add Missing Formats
                        </Link>
                      </div>
                    )}

                    {/* Bouton d'upload */}
                    <button
                      onClick={handleAutomaticUpload}
                      disabled={isUploading || missingFormats.length > 0}
                      className="w-full px-4 py-2 text-white transition-colors rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isUploading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <span>Uploading... {Math.round(progress)}%</span>
                        </div>
                      ) : (
                        "Upload Images"
                      )}
                    </button>

                    {isUploading && (
                      <div className="w-full h-2 mt-4 overflow-hidden bg-gray-200 rounded-full">
                        <div
                          className="h-full transition-all duration-300 bg-blue-600"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isFormatModalOpen && selectedFormat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative max-w-4xl p-4 bg-white rounded-lg">
            <button
              onClick={() => setIsFormatModalOpen(false)}
              className="absolute p-2 text-gray-500 hover:text-gray-700 top-2 right-2"
            >
              ✕
            </button>
            <div className="mt-8">
              <img
                src="/images/Format-pub.png"
                alt={`Format ${selectedFormat}`}
                className="max-h-[80vh] w-auto"
              />
            </div>
          </div>
        </div>
      )}
      {/* Modal pour See Offer type */}
      {isOfferTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative max-w-4xl p-4 bg-white rounded-lg">
            <button
              onClick={() => setIsOfferTypeModalOpen(false)}
              className="absolute p-2 text-gray-500 hover:text-gray-700 top-2 right-2"
            >
              ✕
            </button>
            <div className="mt-8">
              <img
                src="/images/page-pub.jpg"
                alt="Offer Type Layout"
                className="max-h-[80vh] w-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

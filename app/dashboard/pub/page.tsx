"use client";

import { auth } from "@/app/firebase/config";
import "@/app/globals.css";
import imageCompression from "browser-image-compression";
import { ChangeEvent, useEffect, useState } from "react";
import Calendar from "react-calendar";
import { useAuthState } from "react-firebase-hooks/auth";
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

export default function PubPage() {
  const [user] = useAuthState(auth);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
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
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [isOfferTypeModalOpen, setIsOfferTypeModalOpen] = useState(false);

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
    const { monday } = getWeekDates(date);
    setSelectedWeek(getWeekNumber(monday));
    setShowForm(true);
    setImageData((prev) => ({ ...prev, weekNumber: weekNum }));
  };
  const bucketName =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "your-project-id.appspot.com";

  const generatePublicUrl = (bucketName: string, imagePath: string): string => {
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
      imagePath
    )}`;
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

      setIsUploading(true);
      setProgress(0);

      const formData = new FormData();

      const fileExtension = imageData.selectedFile.name.split(".").pop();
      const customFileName = `week-${imageData.weekNumber}-${imageData.position}.${fileExtension}`;

      // Pas besoin de recompresser ici car déjà fait dans handleFileUpload
      const renamedFile = new File([imageData.selectedFile], customFileName, {
        type: "image/jpeg", // Force JPEG pour une meilleure compression
      });

      formData.append("file", renamedFile);
      formData.append("country", imageData.country);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || "Upload failed");
      }

      const positionNumber = imageData.position.split("-")[2];
      const imagePath = `pub_images/${imageData.country}/week${imageData.weekNumber}/${positionNumber}/${customFileName}`;
      const imageUrl = generatePublicUrl(bucketName, imagePath);
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${imagePath}`;

      const customDocId = `week-${imageData.weekNumber}-${imageData.position}-${imageData.country}`;

      const saveResponse = await fetch("/api/game-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customDocId,
          imageData: {
            ...imageData,
            imageUrl,
            publicUrl,
          },
        }),
      });

      if (!saveResponse.ok) throw new Error("Failed to save image");

      const timestamp = new Date().toLocaleString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      console.log(`✅ Image ajoutée par ${user?.email} le ${timestamp}`);
      console.log(`📁 Emplacement: ${imagePath}`);
      console.log(
        `📊 Détails: Semaine ${imageData.weekNumber}, Position ${imageData.position}, Pays ${imageData.country}`
      );

      setShowForm(false);
      setImageData((prev) => ({
        ...prev,
        imageUrl: "",
        offerType: "Premium 1",
        position: "P-1-1-1",
        weekNumber: selectedWeek || 0,
        company_name: "",
        country: "ALL",
        format: POSITION_FORMATS["P-1-1-1"],
      }));

      toast.success("Image saved successfully!");
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout de l'image:", error);
      toast.error("Error saving image data. Please try again.");
    } finally {
      setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsUploading(false);
        }, 500);
      }, 500);
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
    const newPosition = POSITIONS[newOfferType][0];
    setImageData((prev) => ({
      ...prev,
      offerType: newOfferType,
      position: newPosition,
      format: POSITION_FORMATS[newPosition],
    }));
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month" && selectedWeek) {
      const currentDate = new Date(date);
      const selectedDate = new Date();
      selectedDate.setDate(
        selectedDate.getDate() +
          (selectedWeek - getWeekNumber(selectedDate)) * 7
      );

      const { monday, sunday } = getWeekDates(selectedDate);

      // Vérifier si la date est dans la semaine sélectionnée
      const isInSelectedWeek = currentDate >= monday && currentDate <= sunday;

      return `
        hover:bg-accent hover:text-accent-foreground
        focus:bg-accent focus:text-accent-foreground
        ${isInSelectedWeek ? "bg-primary text-primary-foreground" : ""}
        ${date.getDay() === 0 || date.getDay() === 6 ? "text-destructive" : ""}
      `.trim();
    }
    return "";
  };

  return (
    <div className="h-[calc(100vh-80px)] overflow-y-auto bg-gray-100">
      <div className="max-w-4xl p-4 mx-auto md:p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Pub Management</h1>
          <h2 className="p-2 text-lg font-semibold text-card-foreground">
            {selectedWeek
              ? `Images for Week ${selectedWeek}`
              : "Loading current week..."}
          </h2>
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
                className="w-full border-none rounded-lg bg-card text-card-foreground"
                tileClassName={tileClassName}
                calendarType="iso8601"
                tileDisabled={({ date, view }) =>
                  view === "month" && date.getDay() === 0
                }
              />
            </div>
          </div>

          {/* Formulaire d'ajout d'image */}
          {showForm && (
            <div className="p-6 border shadow-sm bg-card rounded-xl">
              <h2 className="mb-6 text-xl font-semibold text-card-foreground">
                Add Image for Week {selectedWeek}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Company Name & Country */}
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
                          setImageData({
                            ...imageData,
                            company_name: value,
                          });
                        }}
                        className="block w-full px-3 py-2 mt-1 border rounded-md shadow-sm bg-input text-input-foreground focus:border-ring focus:ring-ring"
                        placeholder="Enter company name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Country
                      </label>
                      <select
                        value={imageData.country}
                        onChange={(e) =>
                          setImageData({
                            ...imageData,
                            country: e.target.value,
                          })
                        }
                        className="block w-full px-3 py-2 mt-1 border rounded-md shadow-sm bg-input text-input-foreground focus:border-ring focus:ring-ring"
                      >
                        <option value="ALL">All Countries</option>
                        {/* <option value="FR">France</option>
                        <option value="ESP">Spain</option>
                        <option value="RU">Russia</option> */}
                      </select>
                    </div>
                  </div>

                  {/* Offer Type & Position */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Offer Type
                      </label>
                      <div className="flex items-center gap-4 mt-1">
                        <select
                          value={imageData.offerType}
                          onChange={(e) =>
                            handleOfferTypeChange(e.target.value as OfferType)
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
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">
                        Position
                      </label>
                      <div className="flex items-center gap-4 mt-1">
                        <select
                          value={imageData.position}
                          onChange={(e) =>
                            handlePositionChange(e.target.value as PositionCode)
                          }
                          className="flex-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-input text-input-foreground focus:border-ring focus:ring-ring"
                        >
                          {POSITIONS[imageData.offerType].map((position) => (
                            <option key={position} value={position}>
                              {position}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Format
                  </label>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex-1 px-4 py-2 border rounded-md bg-gray-50">
                      <span className="text-sm text-muted-foreground">
                        {imageData.format}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFormat(imageData.format);
                        setIsFormatModalOpen(true);
                      }}
                      className="px-4 py-2 text-sm font-semibold text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      View Format
                    </button>
                  </div>
                </div>

                {/* Upload Image */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Upload Image
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full px-4 py-2 text-white transition-colors rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Save Image"}
                </button>
              </form>
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

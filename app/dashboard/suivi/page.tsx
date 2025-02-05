"use client";

import { auth } from "@/app/firebase/config";
import "@/app/globals.css";
import { ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "sonner";
import { ImageData } from "../pub/page";

export default function SuiviPage() {
  const [user] = useAuthState(auth);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [weekImages, setWeekImages] = useState<ImageData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // Réutiliser les fonctions nécessaires de PubPage
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
  };

  const fetchWeekImages = async (weekNum: number) => {
    try {
      const response = await fetch(`/api/game-images?weekNumber=${weekNum}`);
      if (!response.ok)
        throw new Error(`Failed to fetch images: ${response.statusText}`);
      const data = await response.json();
      if (data.images) {
        setWeekImages(
          data.images.map((image: ImageData) => ({
            ...image,
            createdAt: new Date(image.createdAt),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("Error loading images. Please try again.");
    }
  };

  useEffect(() => {
    if (selectedWeek) {
      fetchWeekImages(selectedWeek);
    }
  }, [selectedWeek]);

  const filteredImages = weekImages.filter((image) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      image.company_name.toLowerCase().includes(query) ||
      image.offerType.toLowerCase().includes(query) ||
      image.position.toLowerCase().includes(query) ||
      image.country.toLowerCase().includes(query);

    const matchesCountry = selectedCountry
      ? image.country === selectedCountry
      : true;

    return matchesQuery && matchesCountry;
  });

  // Fonction pour grouper les images par client
  const groupImagesByClient = (images: ImageData[]) => {
    return images.reduce((acc, image) => {
      const clientKey = image.company_name;
      if (!acc[clientKey]) {
        acc[clientKey] = {
          offers: new Set(),
          images: [],
          isPartner: !image.company_name.includes("-"), // Vérifie si c'est une offre partenaire (ajoutée manuellement)
        };
      }
      acc[clientKey].offers.add(image.offerType);
      acc[clientKey].images.push(image);
      return acc;
    }, {} as Record<string, { offers: Set<string>; images: ImageData[]; isPartner: boolean }>);
  };

  const handleDelete = async (image: ImageData) => {
    try {
      const docId = `week-${image.weekNumber}-${image.position}-${image.country}`;
      setDeletingImageId(docId);
      setDeleteProgress(0);

      // Simuler une progression
      const progressInterval = setInterval(() => {
        setDeleteProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const positionNumber = image.position.split("-")[2];
      const imagePath = `pub_images/${image.country}/week${
        image.weekNumber
      }/${positionNumber}/${image.position}.${image.imageUrl.split(".").pop()}`;

      const response = await fetch("/api/game-images/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          docId,
          imagePath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete image");
      }

      // Compléter la progression
      setDeleteProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const timestamp = new Date().toLocaleString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      console.log(`🗑️ Image supprimée par ${user?.email} le ${timestamp}`);
      console.log(`📁 Emplacement: ${imagePath}`);
      console.log(
        `📊 Détails: Semaine ${image.weekNumber}, Position ${image.position}, Pays ${image.country}`
      );

      if (selectedWeek) {
        await fetchWeekImages(selectedWeek);
      }

      toast.success("Image deleted successfully!");
    } catch (error) {
      console.error("❌ Erreur lors de la suppression de l'image:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete image"
      );
    } finally {
      setDeletingImageId(null);
      setDeleteProgress(0);
    }
  };

  const handleImageClick = async (image: ImageData) => {
    if (image.publicUrl) {
      // Si l'URL publique existe déjà, ouvrir dans un nouvel onglet
      window.open(image.publicUrl, "_blank");
    } else {
      try {
        // Créer une URL publique
        const positionNumber = image.position.split("-")[2];
        const fileExtension = image.imageUrl.split(".").pop();
        const imagePath = `pub_images/ALL/week${image.weekNumber}/${positionNumber}/${image.position}.${fileExtension}`;

        // Faire la requête pour rendre l'image publique
        const response = await fetch("/api/make-public", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imagePath }),
        });

        if (!response.ok) {
          throw new Error("Failed to make image public");
        }

        const { publicUrl } = await response.json();

        // Mettre à jour le document dans Firestore
        const docId = `week-${image.weekNumber}-${image.position}-${image.country}`;
        await fetch("/api/game-images", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            docId,
            updates: { publicUrl },
          }),
        });

        // Ouvrir la nouvelle URL publique
        window.open(publicUrl, "_blank");

        // Rafraîchir les images
        if (selectedWeek) {
          await fetchWeekImages(selectedWeek);
        }
      } catch (error) {
        console.error("Error making image public:", error);
        toast.error("Failed to generate public URL");
      }
    }
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
      <div className="p-4 mx-auto max-w-7xl md:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Calendrier */}
          <div className="lg:col-span-1">
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
          </div>

          {/* Liste des images */}
          <div className="lg:col-span-2">
            <div className="p-6 border shadow-sm bg-card rounded-xl flex flex-col h-[calc(100vh-160px)]">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="px-2 py-1 border rounded-md shadow-sm bg-input text-input-foreground focus:border-ring focus:ring-ring"
                />
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="px-2 py-1 border rounded-md shadow-sm bg-input text-input-foreground focus:border-ring focus:ring-ring"
                >
                  <option value="">All Countries</option>
                  {/* <option value="FR">France</option>
                  <option value="ESP">Spain</option>
                  <option value="RU">Russia</option> */}
                </select>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto">
                {Object.entries(groupImagesByClient(filteredImages)).map(
                  ([clientName, data]) => (
                    <div
                      key={clientName}
                      className="overflow-hidden border rounded-lg hover:border-primary/50"
                    >
                      <button
                        onClick={() =>
                          setExpandedClient(
                            expandedClient === clientName ? null : clientName
                          )
                        }
                        className="flex items-center justify-between w-full p-4 text-left transition-colors hover:bg-accent/50"
                      >
                        <div className="flex items-center space-x-4">
                          <h3 className="text-lg font-semibold">
                            {clientName}
                          </h3>
                          <div className="text-sm text-muted-foreground">
                            Offers: {Array.from(data.offers).join(", ")}
                          </div>
                        </div>
                        {expandedClient === clientName ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>

                      {expandedClient === clientName && (
                        <div className="p-4 space-y-4 border-t">
                          {data.images.map((image, index) => (
                            <div
                              key={index}
                              className="p-4 transition-colors border rounded-lg hover:bg-accent/50"
                            >
                              <div className="flex items-start justify-between w-full gap-4">
                                <div className="flex flex-col flex-1">
                                  <div className="flex flex-col items-start space-y-2">
                                    <p className="text-sm font-medium text-card-foreground">
                                      Offer Type: {image.offerType}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Position: {image.position}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Format: {image.format}
                                    </p>
                                  </div>
                                </div>

                                <div
                                  className="min-w-[120px] w-[120px] h-[120px] overflow-hidden rounded-lg cursor-pointer"
                                  onClick={() => handleImageClick(image)}
                                >
                                  <Image
                                    src={image.publicUrl || image.imageUrl}
                                    alt={`${image.company_name} - ${image.position}`}
                                    width={120}
                                    height={120}
                                    className="object-cover w-full h-full transition-opacity hover:opacity-80"
                                  />
                                </div>

                                <div className="flex items-start">
                                  <button
                                    onClick={() => handleDelete(image)}
                                    disabled={deletingImageId !== null}
                                    className="p-2 text-sm font-medium transition-colors rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-50"
                                  >
                                    {deletingImageId ===
                                    `week-${image.weekNumber}-${image.position}-${image.country}` ? (
                                      <div className="flex flex-col items-center">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <div className="w-10 h-1 mt-1 overflow-hidden bg-gray-200 rounded-full">
                                          <div
                                            className="h-full transition-all duration-300 bg-red-600"
                                            style={{
                                              width: `${deleteProgress}%`,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <Trash2 className="w-5 h-5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}

                {filteredImages.length === 0 && selectedWeek && (
                  <p className="py-4 text-center text-muted-foreground">
                    No images found for this week
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

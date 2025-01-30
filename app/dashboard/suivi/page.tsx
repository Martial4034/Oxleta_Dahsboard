"use client";

import { auth } from "@/app/firebase/config";
import "@/app/globals.css";
import { Trash2 } from "lucide-react";
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

  const handleDelete = async (image: ImageData) => {
    try {
      const docId = `week-${image.weekNumber}-${image.position}-${image.country}`;
      const positionNumber = image.position.split("-")[2];
      const imagePath = `pub_images/${image.country}/week${
        image.weekNumber
      }/${positionNumber}/week-${image.weekNumber}-${
        image.position
      }.${image.imageUrl.split(".").pop()}`;

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
                {filteredImages.map((image, index) => (
                  <div
                    key={index}
                    className="p-4 transition-colors border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-start justify-between w-full gap-4">
                      <div className="flex flex-col flex-1">
                        <div className="flex flex-col items-start space-y-2">
                          <p className="text-lg font-bold text-card-foreground">
                            {image.company_name}
                          </p>
                          <div className="flex flex-col items-start space-y-1">
                            <p className="text-sm font-medium text-card-foreground">
                              Offer Type: {image.offerType}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Position: {image.position}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">
                                Format: {image.format}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Week {image.weekNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Country: {image.country}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="min-w-[120px] w-[120px] h-[120px] overflow-hidden rounded-lg">
                        <Image
                          src={image.publicUrl}
                          alt={`${image.company_name} - ${image.position}`}
                          width={120}
                          height={120}
                          className="object-cover w-full h-full"
                        />
                      </div>

                      <div className="flex items-start">
                        <button
                          onClick={() => handleDelete(image)}
                          className="p-2 text-sm font-medium transition-colors rounded-md text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

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

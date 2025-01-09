import { Calendar, Globe, Layers } from "lucide-react"; // Importing icons from LucideReact

const HomePage = () => {
  return (
    <div className="flex flex-col items-center min-h-screen p-6 bg-gray-100">
      <header className="w-full max-w-6xl mb-8">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          Dashboard Oxelta
        </h1>
        <p className="mt-4 text-lg text-center text-gray-600">
          Ce tableau de bord permet de gérer efficacement les publicités en
          fonction des pays, des offres disponibles et des périodes d'affichage.
        </p>
      </header>

      <main className="w-full max-w-6xl p-6 bg-white rounded-lg shadow-md">
        <section className="mb-6">
          <h2 className="mb-4 text-2xl font-semibold text-gray-700">
            Fonctionnalités principales
          </h2>
          <ul className="space-y-2 list-disc list-inside">
            <li className="flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-500" />
              Gestion des publicités par pays.
            </li>
            <li className="flex items-center">
              <Layers className="w-5 h-5 mr-2 text-green-500" />
              Organisation des différentes offres publicitaires.
            </li>
            <li className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-500" />
              Planification et gestion des périodes d'affichage.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="mb-4 text-2xl font-semibold text-gray-700">
            Pourquoi utiliser ce dashboard ?
          </h2>
          <p className="text-gray-600">
            Notre dashboard offre une interface intuitive pour suivre vos
            campagnes publicitaires et optimiser vos performances. Vous pouvez
            facilement organiser vos publicités et maximiser leur impact en
            fonction des régions et des offres.
          </p>
        </section>
      </main>

      <footer className="w-full max-w-6xl mt-8 text-center text-gray-500">
        <p>© 2025 Dashboard Oxelta. Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default HomePage;

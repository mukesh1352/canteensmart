// src/app/canteen/page.tsx (App Router)
export default function WaterSensing() {
    return (
      <div className="h-screen w-full">
        <h1 className="text-2xl font-bold p-4">Canteen Demand Forecast</h1>
        <iframe
          src="https://canteensmart-egwpgyar3nmypxovty5hrs.streamlit.app/"
          width="100%"
          height="100%"
          className="min-h-[90vh] border-none"
          allowFullScreen
        />
      </div>
    );
  }
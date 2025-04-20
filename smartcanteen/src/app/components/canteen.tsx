// src/app/canteen/page.tsx (App Router)
export default function CanteenPage() {
    return (
      <div className="h-screen w-full">
        <h1 className="text-2xl font-bold p-4">Canteen Demand Forecast</h1>
        <iframe
          src="https://canteensmart-7akz9kspcnixer96xiuarb.streamlit.app/?embed=true"
          width="100%"
          height="100%"
          className="min-h-[90vh] border-none"
          allowFullScreen
        />
      </div>
    );
  }
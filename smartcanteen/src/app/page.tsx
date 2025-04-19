// import Image from "next/image";
import Header from "./components/header";
import ItemsDisplay from "./components/items";
import AnalyticsPage from "./components/analytics";
export default function Home() {
  return (
    <>
      <Header />
      <ItemsDisplay />
      <AnalyticsPage />
    </>
  );
}

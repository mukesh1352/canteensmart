// import Image from "next/image";
import Header from "./components/header";
import ItemsDisplay from "./components/items";
import HistoryPage from "./history/page";

export default function Home() {
  return (
    <>
      <Header />
      <ItemsDisplay />
      <HistoryPage />
    </>
  );
}

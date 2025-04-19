// import Image from "next/image";
import Header from "./components/header";
import ItemsDisplay from "./components/items";
import SmartChatbot from "./components/SmartChatbot";
export default function Home() {
  return (
    <>
      <Header />
      <ItemsDisplay />
      <SmartChatbot />
    </>
  );
}

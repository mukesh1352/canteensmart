// import Image from "next/image";
import Header from "./components/header";
import ItemsDisplay from "./components/items";
import CounterMonitor from "./components/counter";
export default function Home() {
  return (
    <>
      <Header />
      <ItemsDisplay />
      <CounterMonitor />
    </>
  );
}

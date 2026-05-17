import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { SceneRoot } from "@/scene/SceneRoot";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { LenisProvider } from "@/scroll/Lenis";

const Home = lazy(() => import("@/routes/Home"));
const Privacy = lazy(() => import("@/routes/Privacy"));
const Terms = lazy(() => import("@/routes/Terms"));
const NotFound = lazy(() => import("@/routes/NotFound"));

export default function App() {
  return (
    <LenisProvider>
      <SceneRoot />
      <Nav />
      <Suspense fallback={<div style={{ minHeight: "100dvh" }} />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
    </LenisProvider>
  );
}

// Asphalt Opera app frame: this route is intentionally a full-screen game, not a marketing or admin interface.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import GameCanvas from "@/components/GameCanvas";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><GameCanvas /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}


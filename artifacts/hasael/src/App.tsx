import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import Feed from "@/pages/feed";
import MyFarms from "@/pages/farms/index";
import NewFarm from "@/pages/farms/new";
import FarmDetail from "@/pages/farms/detail";
import MyInvestments from "@/pages/investments/index";
import FarmInvestments from "@/pages/investments/farm";
import Services from "@/pages/services/index";
import MyServices from "@/pages/services/my";
import Notifications from "@/pages/notifications/index";
import PublicProfile from "@/pages/profile/index";
import Products from "@/pages/products/index";
import MyProducts from "@/pages/products/my";
import NewProduct from "@/pages/products/new";
import ProductDetail from "@/pages/products/detail";
import EditProduct from "@/pages/products/edit";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Landing} />
      <Route path="/feed" component={Feed} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/services" component={Services} />
      <Route path="/profile/:id" component={PublicProfile} />
      <Route path="/products" component={Products} />

      {/* Protected Routes — static paths before dynamic :id */}
      <Route path="/dashboard"><ProtectedRoute><Dashboard /></ProtectedRoute></Route>
      <Route path="/farms"><ProtectedRoute><MyFarms /></ProtectedRoute></Route>
      <Route path="/farms/new"><ProtectedRoute><NewFarm /></ProtectedRoute></Route>
      <Route path="/farms/:id"><ProtectedRoute><FarmDetail /></ProtectedRoute></Route>

      <Route path="/investments"><ProtectedRoute><MyInvestments /></ProtectedRoute></Route>
      <Route path="/investments/farm/:id"><ProtectedRoute><FarmInvestments /></ProtectedRoute></Route>

      <Route path="/services/my"><ProtectedRoute><MyServices /></ProtectedRoute></Route>

      <Route path="/products/new"><ProtectedRoute><NewProduct /></ProtectedRoute></Route>
      <Route path="/products/my"><ProtectedRoute><MyProducts /></ProtectedRoute></Route>
      <Route path="/products/:id/edit"><ProtectedRoute><EditProduct /></ProtectedRoute></Route>

      {/* Dynamic product detail — must come after all static /products/* routes */}
      <Route path="/products/:id" component={ProductDetail} />

      <Route path="/notifications"><ProtectedRoute><Notifications /></ProtectedRoute></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

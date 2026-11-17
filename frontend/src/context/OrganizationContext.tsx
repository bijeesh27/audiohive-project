import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getMyOrganization } from "../services/organizationServices";
import { subscriptionService } from "../services/subscriptionServices";

export interface OrganizationInfo {
  _id: string;
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  planId: string;
  status: "active" | "suspended" | "pending" | "archived";
  planName: string;
}

interface OrganizationContextType {
  organization: OrganizationInfo | null;
  loading: boolean;
  error: string | null;
  refreshOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrg = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyOrganization();
      const orgData = res?.data;

      if (!orgData) {
        setOrganization(null);
        return;
      }

      let planName = "Free Plan";
      try {
        const plansRes = await subscriptionService.getAllSubscriptions();
        const allPlans = plansRes.data || [];
        const matched =
          orgData.planId === "free"
            ? allPlans.find((p: { price: number }) => p.price === 0)
            : allPlans.find((p: { _id: string }) => p._id === orgData.planId);
        if (matched?.subscriptionName) {
          planName = matched.subscriptionName;
        }
      } catch {
        // Fall back to Free Plan if subscriptions endpoint fails
      }

      setOrganization({
        _id: orgData._id || orgData.id || "",
        companyName: orgData.companyName || "My Organization",
        ownerName: orgData.ownerName || "Owner",
        ownerEmail: orgData.ownerEmail || "",
        planId: orgData.planId || "free",
        status: orgData.status || "active",
        planName,
      });
    } catch {
      setError("Failed to load organization information");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        loading,
        error,
        refreshOrganization: fetchOrg,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
};

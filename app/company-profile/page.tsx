"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { Header } from "../components/Header";
import { AppTabs } from "../components/AppTabs";
import { Card, Button, Input, Select } from "../components/DemoComponents";
import { supabase } from "../../lib/supabaseClient";
import Image from "next/image";

type CompanyData = {
  name: string;
  taxId: string;
  city: string;
  country: string;
  postalCode: string;
  address: string;
  dunsId: string;
  logoUrl: string | null;
};

export default function CompanyProfilePage() {
  const [company, setCompany] = useState<CompanyData>({
    name: "",
    taxId: "",
    city: "",
    country: "",
    postalCode: "",
    address: "",
    dunsId: "",
    logoUrl: null,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [countries, setCountries] = useState<{ name: string; iso2: string }[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Types for country API response
  type RestCountry = {
    cca2: string;
    name: {
      common: string;
      [key: string]: string;
    };
    [key: string]: string | object;
  };

  // Fetch country list from restcountries.com
  useEffect(() => {
    setCountriesLoading(true);
    fetch("https://restcountries.com/v3.1/all?fields=name,cca2")
      .then((res) => res.json())
      .then((data: RestCountry[]) => {
        // Sort by name, filter out missing ISO2
        const countryList = data
          .filter((c: RestCountry) => c.cca2 && c.name && c.name.common)
          .map((c: RestCountry) => ({
            name: c.name.common,
            iso2: c.cca2,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(countryList);
      })
      .catch(() => setCountries([]))
      .finally(() => setCountriesLoading(false));
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setCompany((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCompany((prev) => ({
          ...prev,
          logoUrl: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    let logoUrl = company.logoUrl;

    // Upload logo file to Supabase Storage if present
    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop();
      const safeCompanyName = company.name.trim().replace(/\s+/g, "_");
      const fileName = `${safeCompanyName}-logo_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, logoFile, { upsert: true });

      if (uploadError) {
        setError("Failed to upload logo: " + uploadError.message);
        setSubmitting(false);
        return;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);
      logoUrl = publicUrlData?.publicUrl || null;
    }

    // Insert company profile into Supabase
    const { error: insertError } = await supabase
      .from("company_profiles")
      .insert([
        {
          ...company,
          logoUrl,
        },
      ]);

    if (insertError) {
      setError("Failed to save company profile: " + insertError.message);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <Header />
        <AppTabs />
        <Card title="Company Profile" className="mb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                Company Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={company.name}
                onChange={handleChange}
                placeholder="Enter company name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="taxId">
                Tax ID
              </label>
              <Input
                id="taxId"
                name="taxId"
                type="text"
                value={company.taxId}
                onChange={handleChange}
                placeholder="Enter tax ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="city">
                City
              </label>
              <Input
                id="city"
                name="city"
                type="text"
                value={company.city}
                onChange={handleChange}
                placeholder="Enter city"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="country">
                Country
              </label>
              <Select
                id="country"
                name="country"
                value={company.country}
                onChange={e =>
                  setCompany(prev => ({
                    ...prev,
                    country: e.target.value,
                  }))
                }
                required
                disabled={countriesLoading}
              >
                <option value="" disabled>
                  {countriesLoading ? "Loading countries..." : "Select a country"}
                </option>
                {countries.map((c) => (
                  <option key={c.iso2} value={c.iso2}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="postalCode">
                Postal Code
              </label>
              <Input
                id="postalCode"
                name="postalCode"
                type="text"
                value={company.postalCode}
                onChange={handleChange}
                placeholder="Enter postal code"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="address">
                Address
              </label>
              <Input
                id="address"
                name="address"
                type="text"
                value={company.address}
                onChange={handleChange}
                placeholder="Enter address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="dunsId">
                D-U-N-S ID
              </label>
              <Input
                id="dunsId"
                name="dunsId"
                type="text"
                value={company.dunsId}
                onChange={handleChange}
                placeholder="Enter D-U-N-S ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="logo">
                Company Logo
              </label>
              <Input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
              />
              {company.logoUrl && (
                <div className="mt-2">
                  <Image
                    src={company.logoUrl}
                    alt="Company Logo Preview"
                    height={96}
                    width={96}
                    className="h-24 w-24 object-contain border rounded bg-white"
                  />
                </div>
              )}
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
              {submitting ? "Saving..." : "Save Profile"}
            </Button>
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            {success && <div className="text-green-600 text-sm mt-2">Company profile saved!</div>}
          </form>
        </Card>
      </div>
    </div>
  );
}

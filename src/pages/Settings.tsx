import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { PasswordSettings } from "@/components/settings/PasswordSettings";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { RoleDisplay } from "@/components/settings/RoleDisplay";
import { DictionariesSettings } from "@/components/settings/DictionariesSettings";
import { VatSettings } from "@/components/settings/VatSettings";

const Settings = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="dictionaries">Dictionaries</TabsTrigger>
            <TabsTrigger value="vat">VAT</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="password" className="mt-6">
            <PasswordSettings />
          </TabsContent>

          <TabsContent value="theme" className="mt-6">
            <ThemeSettings />
          </TabsContent>

          <TabsContent value="roles" className="mt-6">
            <RoleDisplay />
          </TabsContent>

          <TabsContent value="dictionaries" className="mt-6">
            <DictionariesSettings />
          </TabsContent>

          <TabsContent value="vat" className="mt-6">
            <VatSettings />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;

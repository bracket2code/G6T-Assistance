import { supabase } from "../supabase";
import { handleRequest } from "../utils";
import type { User } from "../../types/auth";

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await handleRequest(() =>
      supabase.auth.signInWithPassword({
        email,
        password,
      })
    );

    if (error) throw error;

    return {
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: data.user?.user_metadata?.role || "user",
      },
    };
  } catch (error) {
    console.error("Error signing in:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error durante el inicio de sesión";
    throw new Error(message);
  }
};

export const signUp = async (userData: Omit<User, "id">) => {
  try {
    // Create auth user
    const { data: authData, error: authError } = await handleRequest(() =>
      supabase.auth.signUp({
        email: userData.email,
        password: userData.password || "",
        options: {
          data: {
            name: userData.name,
            alias: userData.alias,
            lastName: userData.lastName || "",
            idType: userData.idType || "DNI",
            idNumber: userData.idNumber || "",
            phone: userData.phone || "",
            address: userData.address || "",
            birthDate: userData.birthDate || null,
            role: userData.role || "user",
          },
        },
      })
    );

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error("No se pudo crear el usuario");
    }

    // Get role ID
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", userData.role || "user")
      .single();

    if (roleError) throw roleError;

    // Create user record in the database
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        alias: userData.alias,
        last_name: userData.lastName || "",
        id_type: userData.idType || "DNI",
        id_number: userData.idNumber || "",
        phone: userData.phone || "",
        address: userData.address || "",
        birth_date: userData.birthDate || null,
        role_id: roleData.id,
        show_welcome_splash: true,
      })
      .select()
      .single();

    if (dbError) {
      // If database insert fails, delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw dbError;
    }

    // If user has businesses and is not admin, create user-business relationships
    if (
      userData.businesses &&
      userData.businesses.length > 0 &&
      userData.role !== "admin"
    ) {
      const { error: businessError } = await supabase
        .from("user_businesses")
        .insert(
          userData.businesses.map((business) => ({
            user_id: authData.user.id,
            business_id: business.id,
          }))
        );

      if (businessError) {
        // If business relationships fail, clean up user records
        await supabase.from("users").delete().eq("id", authData.user.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw businessError;
      }
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        role: userData.role || "user",
      },
    };
  } catch (error) {
    console.error("Error signing up:", error);
    const message =
      error instanceof Error ? error.message : "Error durante el registro";
    throw new Error(message);
  }
};

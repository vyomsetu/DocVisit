import * as SecureStore from "expo-secure-store";

export const saveToken = (token: string) =>
  SecureStore.setItemAsync("token", token);

export const getToken = () => SecureStore.getItemAsync("token");

export const deleteToken = () => SecureStore.deleteItemAsync("token");

export const saveTempToken = (token: string) =>
  SecureStore.setItemAsync("tempToken", token);

export const getTempToken = () => SecureStore.getItemAsync("tempToken");

export const deleteTempToken = () => SecureStore.deleteItemAsync("tempToken");

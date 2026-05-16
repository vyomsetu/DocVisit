import { Stack } from "expo-router";
import { T } from "../../constants/Theme";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: T.bg },
        animation: "slide_from_right",
      }}
    />
  );
}

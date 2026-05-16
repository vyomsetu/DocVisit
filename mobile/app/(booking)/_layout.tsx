import { Stack } from "expo-router";
import { T } from "../../constants/Theme";

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: T.card },
        headerTintColor: T.teal,
        headerTitleStyle: { fontWeight: "700", color: T.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: T.bg },
        animation: "slide_from_bottom",
      }}
    />
  );
}

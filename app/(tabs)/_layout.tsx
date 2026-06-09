import React from 'react';
import { Tabs } from 'expo-router';

/**
 * Feed = default/main immersive page (kendi köşe butonları var, alt bar yok).
 * Diğer ekranlar feed'in köşe butonlarından açılır ve kendi geri butonları var.
 * Bu yüzden alt pill tab bar kaldırıldı.
 */
export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="feed"
      tabBar={() => null}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="home-card" />
      <Tabs.Screen name="themes" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

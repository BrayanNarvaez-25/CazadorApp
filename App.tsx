import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DB_NAME, initDatabase } from './src/database/db';
import ListaScreen from './src/screens/ListaScreen';
import FormularioScreen from './src/screens/FormularioScreen';

// Tipado de la navegación: define qué parámetros recibe cada pantalla
export type RootStackParamList = {
  Lista: undefined;
  Formulario:
    | {
        id?: number;
        tituloActual?: string;
        calificacionActual?: number;
        comentariosActuales?: string;
        fotoActual?: string;
      }
    | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [dbLista, setDbLista] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reto 1: estado de carga mientras se ejecuta initDatabase
  useEffect(() => {
    initDatabase()
      .then(() => setDbLista(true))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text>Error al iniciar la base de datos:</Text>
        <Text>{error}</Text>
      </View>
    );
  }

  if (!dbLista) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Reto 2: SQLiteProvider envuelve TODA la app
  return (
    <SQLiteProvider databaseName={DB_NAME}>
      {/* Reto 3: navegación con las dos pantallas */}
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator initialRouteName="Lista">
          <Stack.Screen
            name="Lista"
            component={ListaScreen}
            options={{ title: 'Cazador de Sabores' }}
          />
          <Stack.Screen
            name="Formulario"
            component={FormularioScreen}
            options={{ title: 'Registro' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SQLiteProvider>
  );
}
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DB_NAME, initDatabase } from './src/database/db';
import ListaScreen from './src/screens/ListaScreen';
import FormularioScreen from './src/screens/FormularioScreen';

const COLORES = {
  fondo: '#FAF6F0',
  header: '#F3E7D8',
  bordeHeader: '#E3D6C6',
  primario: '#C0714B',
  texto: '#3D2F26',
  textoSuave: '#8A7767',
  peligro: '#B5473A',
};

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

// Título de la pantalla principal: icono + nombre de la app
const TituloLista = () => (
  <View style={styles.tituloFila}>
    <Ionicons name="restaurant" size={20} color={COLORES.primario} />
    <Text style={styles.tituloTexto}>Cazador de Sabores</Text>
  </View>
);

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
      <View style={styles.centro}>
        <Text style={styles.errorTitulo}>Error al iniciar la base de datos</Text>
        <Text style={styles.errorTexto}>{error}</Text>
      </View>
    );
  }

  if (!dbLista) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={COLORES.primario} />
      </View>
    );
  }

  // Reto 2: SQLiteProvider envuelve TODA la app
  return (
    <SQLiteProvider databaseName={DB_NAME}>
      {/* Reto 3: navegación con las dos pantallas */}
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="Lista"
          screenOptions={{
            headerStyle: { backgroundColor: COLORES.header },
            headerTintColor: COLORES.primario,
            headerTitleAlign: 'center',
            headerTitleStyle: {
              color: COLORES.texto,
              fontSize: 20,
              fontWeight: '800',
            },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: COLORES.fondo },
          }}
        >
          <Stack.Screen
            name="Lista"
            component={ListaScreen}
            options={{ headerTitle: TituloLista }}
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

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORES.fondo,
  },
  errorTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORES.peligro,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorTexto: {
    fontSize: 14,
    color: COLORES.textoSuave,
    textAlign: 'center',
  },
  tituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tituloTexto: {
    marginLeft: 8,
    fontSize: 20,
    fontWeight: '800',
    color: COLORES.texto,
  },
});
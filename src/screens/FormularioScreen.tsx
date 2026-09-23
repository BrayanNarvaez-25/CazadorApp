import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Formulario'>;

const MAX_ESTRELLAS = 10;

// Fecha actual en formato dd/mm/aaaa
const fechaHoy = (): string => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

export default function FormularioScreen({ navigation, route }: Props) {
  const db = useSQLiteContext();

  // Parámetros recibidos desde la lista (undefined si estamos creando)
  const idEdicion = route.params?.id;

  // Estados inicializados con los valores de edición (o vacíos)
  const [titulo, setTitulo] = useState(route.params?.tituloActual || '');
  const [calificacion, setCalificacion] = useState<number>(
    route.params?.calificacionActual || 0
  );
  const [comentarios, setComentarios] = useState(
    route.params?.comentariosActuales || ''
  );
  const [fotoBase64, setFotoBase64] = useState(route.params?.fotoActual || '');
  const [guardando, setGuardando] = useState(false);

  // ---------- Foto ----------
  const opcionesFoto = {
    mediaTypes: ['images'] as ImagePicker.MediaType[],
    allowsEditing: true,
    aspect: [4, 3] as [number, number],
    quality: 0.3,
    base64: true,
  };

  const tomarFoto = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync(opcionesFoto);
    if (!resultado.canceled && resultado.assets[0].base64) {
      setFotoBase64(resultado.assets[0].base64);
    }
  };

  const elegirDeGaleria = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync(opcionesFoto);
    if (!resultado.canceled && resultado.assets[0].base64) {
      setFotoBase64(resultado.assets[0].base64);
    }
  };

  const seleccionarFoto = () => {
    Alert.alert('Foto', 'Elige el origen de la imagen', [
      { text: 'Cámara', onPress: tomarFoto },
      { text: 'Galería', onPress: elegirDeGaleria },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  // ---------- Guardar (INSERT vs UPDATE) ----------
  const guardar = async () => {
    // Validación: todos los campos son obligatorios
    if (!titulo.trim()) {
      Alert.alert('Falta información', 'Escribe un título.');
      return;
    }
    if (calificacion < 1) {
      Alert.alert('Falta información', 'Selecciona una calificación.');
      return;
    }
    if (!comentarios.trim()) {
      Alert.alert('Falta información', 'Escribe un comentario.');
      return;
    }
    if (!fotoBase64) {
      Alert.alert('Falta información', 'Agrega una foto.');
      return;
    }

    setGuardando(true);
    try {
      if (idEdicion !== undefined) {
        // UPDATE: la fecha se actualiza al día de la modificación
        await db.runAsync(
          `UPDATE registros
           SET titulo = ?, calificacion = ?, comentarios = ?, fotoBase64 = ?, fecha = ?
           WHERE id = ?`,
          [titulo.trim(), calificacion, comentarios.trim(), fotoBase64, fechaHoy(), idEdicion]
        );
      } else {
        // INSERT: fecha de creación automática
        await db.runAsync(
          `INSERT INTO registros (titulo, calificacion, comentarios, fotoBase64, fecha)
           VALUES (?, ?, ?, ?, ?)`,
          [titulo.trim(), calificacion, comentarios.trim(), fotoBase64, fechaHoy()]
        );
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el registro.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView>
      <TextInput
        placeholder="Título"
        value={titulo}
        onChangeText={setTitulo}
      />

      {/* 10 estrellas tocables */}
      <View style={{ flexDirection: 'row' }}>
        {Array.from({ length: MAX_ESTRELLAS }, (_, i) => (
          <TouchableOpacity key={i} onPress={() => setCalificacion(i + 1)}>
            <Ionicons
              name={i < calificacion ? 'star' : 'star-outline'}
              size={28}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text>{calificacion}/{MAX_ESTRELLAS}</Text>

      <TextInput
        placeholder="Comentarios"
        value={comentarios}
        onChangeText={setComentarios}
        multiline
      />

      {fotoBase64 !== '' && (
        <Image
          source={{ uri: `data:image/jpeg;base64,${fotoBase64}` }}
          style={{ width: '100%', height: 200 }}
        />
      )}
      <TouchableOpacity onPress={seleccionarFoto}>
        <Ionicons name="camera" size={32} />
      </TouchableOpacity>

      <TouchableOpacity onPress={guardar} disabled={guardando}>
        <Ionicons name="checkmark-circle" size={48} />
      </TouchableOpacity>
    </ScrollView>
  );
}
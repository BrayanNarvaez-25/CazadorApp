import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
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

const COLORES = {
  fondo: '#FAF6F0',
  superficie: '#FFFFFF',
  primario: '#C0714B',
  estrella: '#D9A441',
  texto: '#3D2F26',
  textoSuave: '#8A7767',
  borde: '#E3D6C6',
};

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
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >
      {/* Título */}
      <Text style={styles.etiqueta}>Título</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del lugar o platillo"
        placeholderTextColor={COLORES.textoSuave}
        value={titulo}
        onChangeText={setTitulo}
      />

      {/* Calificación: 10 estrellas tocables */}
      <Text style={styles.etiqueta}>Calificación</Text>
      <View style={styles.estrellasCaja}>
        <View style={styles.estrellasFila}>
          {Array.from({ length: MAX_ESTRELLAS }, (_, i) => (
            <TouchableOpacity key={i} onPress={() => setCalificacion(i + 1)}>
              <Ionicons
                name={i < calificacion ? 'star' : 'star-outline'}
                size={28}
                color={COLORES.estrella}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.calificacionTexto}>
          {calificacion}/{MAX_ESTRELLAS}
        </Text>
      </View>

      {/* Comentarios */}
      <Text style={styles.etiqueta}>Comentarios</Text>
      <TextInput
        style={[styles.input, styles.inputMultilinea]}
        placeholder="¿Qué tal estuvo?"
        placeholderTextColor={COLORES.textoSuave}
        value={comentarios}
        onChangeText={setComentarios}
        multiline
      />

      {/* Foto */}
      <Text style={styles.etiqueta}>Foto</Text>
      <TouchableOpacity
        style={styles.fotoCaja}
        onPress={seleccionarFoto}
        activeOpacity={0.8}
      >
        {fotoBase64 !== '' ? (
          <>
            <Image
              source={{ uri: `data:image/jpeg;base64,${fotoBase64}` }}
              style={styles.foto}
            />
            <View style={styles.fotoBadge}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </View>
          </>
        ) : (
          <View style={styles.fotoVacia}>
            <Ionicons name="camera-outline" size={40} color={COLORES.primario} />
          </View>
        )}
      </TouchableOpacity>

      {/* Guardar */}
      <TouchableOpacity
        style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
        onPress={guardar}
        disabled={guardando}
      >
        <Ionicons name="checkmark" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  contenido: {
    padding: 20,
    paddingBottom: 40,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORES.textoSuave,
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORES.superficie,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORES.texto,
  },
  inputMultilinea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },

  // Estrellas
  estrellasCaja: {
    backgroundColor: COLORES.superficie,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  estrellasFila: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  calificacionTexto: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: COLORES.texto,
  },

  // Foto
  fotoCaja: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  foto: {
    width: '100%',
    height: '100%',
  },
  fotoVacia: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORES.superficie,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORES.borde,
    borderRadius: 12,
  },
  fotoBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORES.primario,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Botón guardar
  botonGuardar: {
    marginTop: 28,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORES.primario,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
});
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../App';
import type { Registro } from '../database/db';

type Props = NativeStackScreenProps<RootStackParamList, 'Lista'>;

const MAX_ESTRELLAS = 10;

const COLORES = {
  fondo: '#FAF6F0',
  superficie: '#FFFFFF',
  primario: '#C0714B',
  estrella: '#D9A441',
  texto: '#3D2F26',
  textoSuave: '#8A7767',
  borde: '#EDE3D6',
  peligro: '#B5473A',
  overlay: 'rgba(61, 47, 38, 0.45)',
};

export default function ListaScreen({ navigation }: Props) {
  // Reto 1: conexión a la base de datos
  const db = useSQLiteContext();

  const [registros, setRegistros] = useState<Registro[]>([]);
  const [comentarioSel, setComentarioSel] = useState<Registro | null>(null);

  // Reto 2: SELECT * FROM registros (más reciente primero)
  const cargarRegistros = useCallback(async () => {
    try {
      const filas = await db.getAllAsync<Registro>(
        'SELECT * FROM registros ORDER BY id DESC'
      );
      setRegistros(filas);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los registros.');
    }
  }, [db]);

  // Reto 3: recargar cada vez que la pantalla recibe el foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', cargarRegistros);
    return unsubscribe;
  }, [navigation, cargarRegistros]);

  const confirmarEliminar = (item: Registro) => {
    Alert.alert(
      'Eliminar registro',
      `¿Seguro que quieres eliminar "${item.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM registros WHERE id = ?', [item.id]);
              await cargarRegistros();
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar el registro.');
            }
          },
        },
      ]
    );
  };

  const irAFormulario = (item?: Registro) => {
    if (!item) {
      navigation.navigate('Formulario');
      return;
    }
    navigation.navigate('Formulario', {
      id: item.id,
      tituloActual: item.titulo,
      calificacionActual: item.calificacion,
      comentariosActuales: item.comentarios,
      fotoActual: item.fotoBase64,
    });
  };

  const renderEstrellas = (calificacion: number) => (
    <View style={styles.estrellasFila}>
      {Array.from({ length: MAX_ESTRELLAS }, (_, i) => (
        <Ionicons
          key={i}
          name={i < calificacion ? 'star' : 'star-outline'}
          size={16}
          color={COLORES.estrella}
        />
      ))}
      <Text style={styles.calificacionTexto}>
        {calificacion}/{MAX_ESTRELLAS}
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: Registro }) => (
    <View style={styles.tarjeta}>
      <Image
        source={{ uri: `data:image/jpeg;base64,${item.fotoBase64}` }}
        style={styles.foto}
      />

      <View style={styles.tarjetaCuerpo}>
        <Text style={styles.titulo}>{item.titulo}</Text>
        {renderEstrellas(item.calificacion)}
        <View style={styles.fechaFila}>
          <Ionicons name="calendar-outline" size={14} color={COLORES.textoSuave} />
          <Text style={styles.fechaTexto}>{item.fecha}</Text>
        </View>
      </View>

      <View style={styles.acciones}>
        <TouchableOpacity
          style={styles.botonIcono}
          onPress={() => setComentarioSel(item)}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={24}
            color={COLORES.texto}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonIcono}
          onPress={() => irAFormulario(item)}
        >
          <Ionicons name="pencil" size={24} color={COLORES.primario} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonIcono}
          onPress={() => confirmarEliminar(item)}
        >
          <Ionicons name="trash" size={24} color={COLORES.peligro} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.contenedor}>
      {/* Reto 4: FlatList */}
      <FlatList
        data={registros}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Ionicons name="restaurant-outline" size={56} color={COLORES.borde} />
            <Text style={styles.vacioTexto}>
              Aún no hay registros. Toca el botón + para agregar uno.
            </Text>
          </View>
        }
      />

      {/* Botón flotante: solo icono */}
      <TouchableOpacity style={styles.fab} onPress={() => irAFormulario()}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal de comentarios */}
      <Modal
        visible={comentarioSel !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setComentarioSel(null)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setComentarioSel(null)}
        >
          <Pressable style={styles.modalCaja}>
            <View style={styles.modalEncabezado}>
              <Text style={styles.modalTitulo} numberOfLines={2}>
                {comentarioSel?.titulo}
              </Text>
              <TouchableOpacity onPress={() => setComentarioSel(null)}>
                <Ionicons name="close" size={26} color={COLORES.texto} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalCuerpo}>
              <Text style={styles.modalTexto}>{comentarioSel?.comentarios}</Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  lista: {
    padding: 16,
    paddingBottom: 110,
    flexGrow: 1,
  },

  // Tarjeta
  tarjeta: {
    backgroundColor: COLORES.superficie,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORES.borde,
    shadowColor: '#8A6E55',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  foto: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: COLORES.borde,
  },
  tarjetaCuerpo: {
    padding: 14,
    paddingBottom: 8,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORES.texto,
    marginBottom: 6,
  },
  estrellasFila: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calificacionTexto: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORES.textoSuave,
  },
  fechaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  fechaTexto: {
    marginLeft: 6,
    fontSize: 13,
    color: COLORES.textoSuave,
  },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORES.borde,
  },
  botonIcono: {
    padding: 8,
    marginLeft: 4,
  },

  // Lista vacía
  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 80,
  },
  vacioTexto: {
    marginTop: 12,
    fontSize: 15,
    textAlign: 'center',
    color: COLORES.textoSuave,
  },

  // Botón flotante
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORES.primario,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },

  // Modal de comentarios
  overlay: {
    flex: 1,
    backgroundColor: COLORES.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  modalCaja: {
    backgroundColor: COLORES.superficie,
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  modalEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },
  modalTitulo: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORES.texto,
    marginRight: 12,
  },
  modalCuerpo: {
    marginTop: 12,
  },
  modalTexto: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORES.texto,
  },
});
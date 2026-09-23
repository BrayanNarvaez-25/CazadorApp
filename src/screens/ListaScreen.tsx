import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
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
    <View style={{ flexDirection: 'row' }}>
      {Array.from({ length: MAX_ESTRELLAS }, (_, i) => (
        <Ionicons
          key={i}
          name={i < calificacion ? 'star' : 'star-outline'}
          size={16}
        />
      ))}
      <Text>{calificacion}/{MAX_ESTRELLAS}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Registro }) => (
    <View>
      <Image
        source={{ uri: `data:image/jpeg;base64,${item.fotoBase64}` }}
        style={{ width: '100%', height: 180 }}
      />
      <Text>{item.titulo}</Text>
      {renderEstrellas(item.calificacion)}
      <Text>{item.fecha}</Text>

      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={() => setComentarioSel(item)}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => irAFormulario(item)}>
          <Ionicons name="pencil" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmarEliminar(item)}>
          <Ionicons name="trash" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Reto 4: FlatList */}
      <FlatList
        data={registros}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text>Aún no hay registros. Toca el botón + para agregar uno.</Text>
        }
      />

      {/* Botón flotante: solo icono */}
      <TouchableOpacity
        onPress={() => irAFormulario()}
        style={{ position: 'absolute', right: 20, bottom: 30 }}
      >
        <Ionicons name="add-circle" size={60} />
      </TouchableOpacity>

      {/* Modal de comentarios */}
      <Modal
        visible={comentarioSel !== null}
        animationType="fade"
        onRequestClose={() => setComentarioSel(null)}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row' }}>
            <Text>{comentarioSel?.titulo}</Text>
            <TouchableOpacity onPress={() => setComentarioSel(null)}>
              <Ionicons name="close" size={26} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <Text>{comentarioSel?.comentarios}</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'cazador.db';

// Tipo de una fila de la tabla 'registros'
export interface Registro {
    id: number;
    titulo: string;
    calificacion: number;
    comentarios: string;
    fotoBase64: string;
    fecha: string;
}

// Abre la base de datos (la crea si no existe) y crea la tabla 'registros'
export const initDatabase = async (): Promise<void> => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    try {
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS registros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        calificacion INTEGER NOT NULL,
        comentarios TEXT NOT NULL,
        fotoBase64 TEXT NOT NULL,
        fecha TEXT NOT NULL
      );
    `);
    } finally {
        // Cerramos esta conexión temporal; el SQLiteProvider abrirá la suya en App.tsx
        await db.closeAsync();
    }
};
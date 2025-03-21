import React, { useState, useCallback } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const PokedexContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', sans-serif;
`;

const SearchBar = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto 20px;

  input {
    padding: 12px 20px;
    border-radius: 20px;
    border: 2px solid #e0e0e0;
    width: 100%;
    font-size: 16px;
    transition: all 0.3s ease;

    &:hover {
      border-color: #9fa8da;
    }

    &:focus {
      outline: none;
      border-color: #3f51b5;
      box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.1);
    }
  }
    
  button {
    padding: 12px 24px;
    border-radius: 20px;
    border: none;
    background: #3f51b5;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    
    &:hover {
      background: #303f9f;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    &:active {
      transform: translateY(0);
      box-shadow: none;
    }
  }

  @media (max-width: 480px) {
    flex-direction: column;
    
    input {
      margin-bottom: 10px;
    }
    
    button {
      width: 100%;
    }
  }
`;

const PokemonCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
`;

const TypeBadge = styled.span`
  padding: 5px 15px;
  border-radius: 15px;
  margin: 0 5px;
  color: white;
  font-weight: bold;
  text-transform: capitalize;
  background-color: ${props => getTypeColor(props.type)};
`;

const StatBar = styled.div`
  width: 100%;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin: 5px 0;
  .stat-fill {
    height: 100%;
    background: #3f51b5;
    width: ${props => (props.value / 255) * 100}%;
    transition: width 0.3s ease;
  }
`;

// Add this function to get colors for different Pokemon types
function getTypeColor(type) {
  const colors = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC'
  };
  return colors[type] || '#777';
}

// Add these new styled components after your existing ones
const MovesSection = styled.div`
  margin-top: 20px;
`;

const GenerationSelect = styled.select`
  padding: 8px;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  margin-bottom: 15px;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: #3f51b5;
  }
`;

const MovesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
`;

const MoveCard = styled.div`
  background: #f5f5f5;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

// Move FilterSelect styled component outside the Pokedex component (keep it with other styled components)
const FilterSelect = styled.select`
  padding: 8px;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  margin-left: 10px;
  margin-bottom: 15px;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: #3f51b5;
  }
`;

const Footer = styled.footer`
  text-align: center;
  margin-top: 40px;
  padding: 20px;
  color: #666;
  
  a {
    color: #3f51b5;
    text-decoration: none;
    font-weight: bold;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Pokedex = () => {
  const [pokemon, setPokemon] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState('1');
  const [moveFilter, setMoveFilter] = useState('level-up');
  const [moves, setMoves] = useState([]);

  // Helper functions
  const getEvolutionDetails = (chain) => {
    const evolutions = [];
    let current = chain;
    while (current) {
      evolutions.push({
        name: current.species.name,
        min_level: current.evolution_details[0]?.min_level || null
      });
      current = current.evolves_to[0];
    }
    return evolutions;
  };

  // Modificar esta función para obtener más datos del movimiento
  const getSpanishMoveName = async (moveUrl) => {
    try {
      const moveResponse = await axios.get(moveUrl);
      const spanishName = moveResponse.data.names.find(
        name => name.language.name === 'es'
      )?.name || null;
      
      // Obtener la descripción en español
      const spanishDescription = moveResponse.data.flavor_text_entries.find(
        entry => entry.language.name === 'es'
      )?.flavor_text || null;
      
      return {
        name: spanishName,
        description: spanishDescription,
        power: moveResponse.data.power,
        accuracy: moveResponse.data.accuracy,
        type: moveResponse.data.type.name
      };
    } catch (error) {
      return { name: null, description: null, power: null, accuracy: null, type: null };
    }
  };

  const getGenerationMoves = useCallback(async (moves, generation) => {
    const filteredMoves = moves.filter(move => {
      const versionGroup = move.version_group_details.find(detail => {
        if (moveFilter !== 'all' && detail.move_learn_method.name !== moveFilter) return false;
        const versionMap = {
          '1': 'red-blue',
          '2': 'gold-silver',
          '3': 'ruby-sapphire',
          '4': 'diamond-pearl',
          '5': 'black-white',
          '6': 'x-y',
          '7': 'sun-moon',
          '8': 'sword-shield'
        };
        return detail.version_group.name === versionMap[generation];
      });
      return versionGroup !== undefined;
    });

    // Obtener nombres y descripciones en español para cada movimiento
    const movesWithSpanishNames = await Promise.all(
      filteredMoves.map(async move => {
        const spanishData = await getSpanishMoveName(move.move.url);
        return {
          name: move.move.name,
          spanishName: spanishData.name,
          description: spanishData.description,
          power: spanishData.power,
          accuracy: spanishData.accuracy,
          type: spanishData.type,
          level: move.version_group_details[0]?.level_learned_at || 1,
          method: move.version_group_details[0]?.move_learn_method.name
        };
      })
    );

    return movesWithSpanishNames.sort((a, b) => a.level - b.level);
  }, [moveFilter]);

  const searchPokemon = async () => {
    try {
      setError('');
      // Añadir manejo de errores más detallado
      console.log(`Buscando Pokémon: ${search.toLowerCase()}`);
      
      // Usar https explícitamente y añadir manejo de errores
      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${search.toLowerCase()}`)
        .catch(error => {
          console.error("Error en la búsqueda del Pokémon:", error);
          throw new Error(`No se pudo encontrar el Pokémon: ${error.message}`);
        });
      
      console.log("Datos del Pokémon recibidos:", response.data.name);
      
      const speciesResponse = await axios.get(response.data.species.url)
        .catch(error => {
          console.error("Error al obtener datos de especie:", error);
          throw new Error(`No se pudieron obtener datos de especie: ${error.message}`);
        });
      
      const evolutionResponse = await axios.get(speciesResponse.data.evolution_chain.url)
        .catch(error => {
          console.error("Error al obtener cadena evolutiva:", error);
          throw new Error(`No se pudo obtener la cadena evolutiva: ${error.message}`);
        });
      
      const spanishName = speciesResponse.data.names.find(
        name => name.language.name === 'es'
      )?.name || response.data.name;

      const getSpanishType = async (typeUrl) => {
        const typeResponse = await axios.get(typeUrl);
        return typeResponse.data.names.find(name => name.language.name === 'es')?.name;
      };

      const types = await Promise.all(
        response.data.types.map(async (type) => ({
          name: type.type.name,
          spanishName: await getSpanishType(type.type.url)
        }))
      );

      setPokemon({
        id: response.data.id,
        name: spanishName,
        types,
        stats: response.data.stats.map(stat => ({
          name: stat.stat.name,
          value: stat.base_stat
        })),
        image: response.data.sprites.other['official-artwork'].front_default,
        evolutions: getEvolutionDetails(evolutionResponse.data.chain),
        allMoves: response.data.moves
      });

      const movesData = await getGenerationMoves(response.data.moves, selectedGeneration);
      setMoves(movesData);
    } catch (err) {
      setError('Pokémon no encontrado');
      setPokemon(null);
      setMoves([]);
    }
  };

  // Fix the useEffect dependency warning
  React.useEffect(() => {
    if (pokemon?.allMoves) {
      getGenerationMoves(pokemon.allMoves, selectedGeneration).then(setMoves);
    }
  }, [selectedGeneration, pokemon, getGenerationMoves]);

  return (
    <PokedexContainer>
      <h1 style={{ textAlign: 'center', color: '#333' }}>La Pokéñex de Ñalfred</h1>
      <SearchBar>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              searchPokemon();
            }
          }}
          placeholder="Ingresa el nombre o número del Pokémon"
        />
        <button onClick={searchPokemon}>Buscar</button>
      </SearchBar>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {pokemon && (
        <PokemonCard>
          <div style={{ textAlign: 'center' }}>
            <img src={pokemon.image} alt={pokemon.name} style={{ width: '300px' }} />
            <h2 style={{ color: '#333' }}>
              #{pokemon.id.toString().padStart(3, '0')} {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
            </h2>
          </div>
          
          <h3>Types:</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {pokemon.types.map(type => (
              <TypeBadge key={type.name} type={type.name}>
                {type.spanishName || type.name}
              </TypeBadge>
            ))}
          </div>

          <h3>Stats:</h3>
          {pokemon.stats.map(stat => (
            <div key={stat.name} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ textTransform: 'capitalize' }}>{stat.name}</span>
                <span>{stat.value}</span>
              </div>
              <StatBar value={stat.value}>
                <div className="stat-fill" />
              </StatBar>
            </div>
          ))}

          <h3>Evolution Chain:</h3>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
            {pokemon.evolutions.map((evo, index) => (
              <React.Fragment key={evo.name}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ textTransform: 'capitalize' }}>{evo.name}</div>
                  {evo.min_level && <div>Level {evo.min_level}</div>}
                </div>
                {index < pokemon.evolutions.length - 1 && (
                  <div>→</div>
                )}
              </React.Fragment>
            ))}
          </div>

          <MovesSection>
            <h3>Movimientos:</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <GenerationSelect 
                value={selectedGeneration}
                onChange={(e) => setSelectedGeneration(e.target.value)}
              >
                <option value="1">Generación I</option>
                <option value="2">Generación II</option>
                <option value="3">Generación III</option>
                <option value="4">Generación IV</option>
                <option value="5">Generación V</option>
                <option value="6">Generación VI</option>
                <option value="7">Generación VII</option>
                <option value="8">Generación VIII</option>
              </GenerationSelect>

              <FilterSelect
                value={moveFilter}
                onChange={(e) => setMoveFilter(e.target.value)}
              >
                <option value="level-up">Subida de nivel</option>
                <option value="machine">MT/MO</option>
                <option value="tutor">Tutor</option>
                <option value="egg">Movimiento Huevo</option>
                <option value="all">Todos los métodos</option>
              </FilterSelect>
            </div>

            <MovesList>
              {moves.map(move => (
                <MoveCard key={move.name}>
                  <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {move.spanishName || move.name.replace('-', ' ')}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    {move.method === 'level-up' 
                      ? `Nivel ${move.level}` 
                      : move.method === 'machine' 
                        ? 'MT/MO'
                        : move.method === 'tutor'
                          ? 'Tutor de Movimientos'
                          : move.method === 'egg'
                            ? 'Movimiento Huevo'
                            : 'Otro método'}
                  </div>
                  {move.type && (
                    <div style={{ 
                      display: 'inline-block', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      color: 'white', 
                      backgroundColor: getTypeColor(move.type),
                      marginBottom: '5px'
                    }}>
                      {move.type}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', marginTop: '3px' }}>
                    {move.power !== null && `Potencia: ${move.power} | `}
                    {move.accuracy !== null && `Precisión: ${move.accuracy}%`}
                  </div>
                  {move.description && (
                    <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '5px' }}>
                      {move.description}
                    </div>
                  )}
                </MoveCard>
              ))}
            </MovesList>
          </MovesSection>
        </PokemonCard>
      )}
      
      <Footer>
        Created by <a href="https://github.com/Kalalo7" target="_blank" rel="noopener noreferrer">Kalalo7</a>
      </Footer>
    </PokedexContainer>
  );
};

export default Pokedex;
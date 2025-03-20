import React, { useState } from 'react';
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
  
  // Modify the getGenerationMoves function
  const getGenerationMoves = (moves, generation) => {
    return moves.filter(move => {
      const versionGroup = move.version_group_details.find(detail => {
        if (moveFilter !== 'all' && detail.move_learn_method.name !== moveFilter) {
          return false;
        }
        switch(generation) {
          case '1': return detail.version_group.name === 'red-blue';
          case '2': return detail.version_group.name === 'gold-silver';
          case '3': return detail.version_group.name === 'ruby-sapphire';
          case '4': return detail.version_group.name === 'diamond-pearl';
          case '5': return detail.version_group.name === 'black-white';
          case '6': return detail.version_group.name === 'x-y';
          case '7': return detail.version_group.name === 'sun-moon';
          case '8': return detail.version_group.name === 'sword-shield';
          default: return false;
        }
      });
      return versionGroup !== undefined;
    }).map(move => ({
      name: move.move.name,
      level: move.version_group_details[0]?.level_learned_at || 1,
      method: move.version_group_details[0]?.move_learn_method.name
    })).sort((a, b) => a.level - b.level);
  };

  const searchPokemon = async () => {
    try {
      setError('');
      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${search.toLowerCase()}`);
      const speciesResponse = await axios.get(response.data.species.url);
      const evolutionResponse = await axios.get(speciesResponse.data.evolution_chain.url);
      
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

      const pokemon = {
        id: response.data.id,
        name: response.data.name,
        types: response.data.types.map(type => type.type.name),
        stats: response.data.stats.map(stat => ({
          name: stat.stat.name,
          value: stat.base_stat
        })),
        moves: response.data.moves.map(move => ({
          name: move.move.name,
          level: move.version_group_details[0]?.level_learned_at || 1
        })).sort((a, b) => a.level - b.level),
        image: response.data.sprites.other['official-artwork'].front_default,
        height: response.data.height / 10,
        weight: response.data.weight / 10,
        evolutions: getEvolutionDetails(evolutionResponse.data.chain),
        allMoves: response.data.moves  // Add this line to include all moves data
      };
      setPokemon(pokemon);
    } catch (err) {
      setError('Pokemon not found');
      setPokemon(null);
    }
  };

  // Replace your existing moves section in the return statement with this:
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
          placeholder="Enter Pokemon name or number"
        />
        <button onClick={searchPokemon}>Search</button>
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
              <TypeBadge key={type} type={type}>{type}</TypeBadge>
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
            <h3>Moves:</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <GenerationSelect 
                value={selectedGeneration}
                onChange={(e) => setSelectedGeneration(e.target.value)}
              >
                <option value="1">Generation I</option>
                <option value="2">Generation II</option>
                <option value="3">Generation III</option>
                <option value="4">Generation IV</option>
                <option value="5">Generation V</option>
                <option value="6">Generation VI</option>
                <option value="7">Generation VII</option>
                <option value="8">Generation VIII</option>
              </GenerationSelect>

              <FilterSelect
                value={moveFilter}
                onChange={(e) => setMoveFilter(e.target.value)}
              >
                <option value="level-up">Level Up Only</option>
                <option value="machine">TM/HM</option>
                <option value="tutor">Move Tutor</option>
                <option value="egg">Egg Moves</option>
                <option value="all">All Methods</option>
              </FilterSelect>
            </div>

            <MovesList>
              {getGenerationMoves(pokemon.allMoves, selectedGeneration).map(move => (
                <MoveCard key={move.name}>
                  <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {move.name.replace('-', ' ')}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {move.method === 'level-up' 
                      ? `Learn at Level ${move.level}` 
                      : `Learn by ${move.method.replace('-', ' ')}`}
                  </div>
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
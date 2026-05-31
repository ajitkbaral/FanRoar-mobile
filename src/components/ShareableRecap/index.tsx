import React from 'react';
import { View, Text } from 'react-native';
import { Theme } from '../../theme';
import { type ApiRecap } from '../../api/types';
import MomentCard from '../MomentCard';
import FRMark from '../shared/FRMark';
import FRCard from '../shared/FRCard';
import FRIcon from '../shared/FRIcon';

interface Props {
  theme: Theme;
  recap: ApiRecap;
  supportingTeamName: string;
}

// Fixed-width, off-screen render of the full recap used as the image-capture
// target for sharing. Mirrors the on-screen RecapScreen layout (headline +
// MomentCard + badges) minus the action buttons, on a solid background, plus a
// FanRoar branding footer so every shared image markets the app.
const ShareableRecap = React.forwardRef<View, Props>(
  ({ theme, recap, supportingTeamName }, ref) => {
    return (
      <View
        ref={ref}
        collapsable={false}
        style={{ width: 380, backgroundColor: theme.bg, padding: 20 }}
      >
        {/* Title */}
        <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
          Full time
        </Text>
        <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 30, color: theme.text, letterSpacing: -1, lineHeight: 34, marginBottom: 12 }}>
          That was loud.
        </Text>

        {/* Moment card */}
        <MomentCard
          theme={theme}
          stats={{
            energyDelivered: recap.energyDelivered,
            shakeEvents: recap.shakeEvents,
            tapCombos: recap.tapCombos,
            rank: recap.rank,
            impactPercent: recap.impactPercent,
          }}
          match={{
            teamA: recap.match.teamA,
            teamB: recap.match.teamB,
            scoreA: recap.match.scoreA,
            scoreB: recap.match.scoreB,
            stage: recap.match.stage,
            date: recap.match.date,
            venue: recap.match.venue,
          }}
          supportingTeam={supportingTeamName}
        />

        {/* Badge unlocks */}
        {recap.badgesUnlocked.map((badge) => (
          <View key={badge.id} style={{ paddingTop: 8 }}>
            <FRCard theme={theme} padding={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: badge.color,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FRIcon name={badge.icon} size={18} color={theme.bg} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 14, color: theme.text }}>
                  {badge.name} unlocked
                </Text>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' }}>
                  {badge.description}
                </Text>
              </View>
              <FRIcon name="check" size={18} color={theme.success} />
            </FRCard>
          </View>
        ))}

        {/* Branding footer */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 16 }}>
          <FRMark size={16} color={theme.textDim} />
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textDim, letterSpacing: 1 }}>
            FanRoar · fanroars.com
          </Text>
        </View>
      </View>
    );
  },
);

export default ShareableRecap;

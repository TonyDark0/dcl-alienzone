import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'

import { ActionButton } from '../components/ActionButton'
import { Panel } from '../components/Panel'
import {
  cycleLabThreat,
  resetLabUi,
  simulateLabResults,
  simulateLabTakeover,
  toggleLabDirection
} from '../state/uiState'
import { UI_COLORS, UI_SPACING, UI_TYPE } from '../theme/tokens'

export function UiLabControls() {
  return (
    <Panel
      variant="quiet"
      uiTransform={{
        positionType: 'absolute',
        position: { top: 270, right: UI_SPACING.lg },
        width: 236,
        padding: UI_SPACING.md,
        flexDirection: 'column',
        zIndex: 20
      }}
    >
      <Label value="UI LAB" fontSize={UI_TYPE.caption} color={UI_COLORS.cyan} />
      <Label
        value="INTERACTIVE STATES"
        fontSize={UI_TYPE.strong}
        color={UI_COLORS.white}
        uiTransform={{ margin: { bottom: UI_SPACING.md } }}
      />
      <UiEntity uiTransform={{ margin: { bottom: UI_SPACING.sm } }}>
        <ActionButton label="THREAT" width={200} tone="secondary" onPress={cycleLabThreat} />
      </UiEntity>
      <UiEntity uiTransform={{ margin: { bottom: UI_SPACING.sm } }}>
        <ActionButton label="DIRECTION" width={200} tone="secondary" onPress={toggleLabDirection} />
      </UiEntity>
      <UiEntity uiTransform={{ margin: { bottom: UI_SPACING.sm } }}>
        <ActionButton label="TAKEOVER" width={200} tone="danger" onPress={simulateLabTakeover} />
      </UiEntity>
      <UiEntity uiTransform={{ margin: { bottom: UI_SPACING.sm } }}>
        <ActionButton label="RESULTS" width={200} tone="secondary" onPress={simulateLabResults} />
      </UiEntity>
      <ActionButton label="RESET" width={200} tone="secondary" onPress={resetLabUi} />
    </Panel>
  )
}

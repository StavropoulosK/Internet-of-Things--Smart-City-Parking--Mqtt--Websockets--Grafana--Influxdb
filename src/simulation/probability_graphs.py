def shade_factor(time_minute, sunrise=420, sunset=1200, shadow=False):
    """
    Compute solar radiation as a function of time in minutes from midnight.
    Start of the day is at 00:00, sunrise is at 07:00, and sunset is at 20:00.
    """
    import numpy as np
    if time_minute < sunrise or time_minute > sunset:
        return 0
    if shadow: 
        return min(0.1, np.sin(np.pi * (time_minute - sunrise) / (sunset - sunrise)))
    return np.sin(np.pi * (time_minute - sunrise) / (sunset - sunrise))

import matplotlib.pyplot as plt

time = range(0, 1440)
radiation = [shade_factor(t) for t in time]
shadow = [shade_factor(t, shadow=True) for t in time]

fig, axs = plt.subplots(1, 1, figsize=(10, 5))
axs.plot(time, radiation, label='No shadow')
axs.plot(time, shadow, label='Shadow')
axs.legend()
axs.grid()
axs.set_xlabel('Time (minutes)')
axs.set_ylabel('Solar radiation')
fig.suptitle('Solar radiation through the day', fontsize=16)
fig.savefig('Presentations/images/solar_radiation.png')
plt.show()


import numpy as np
def probability_to_leave(t, T_max, T_50, k):
    if t < 20:
        return 0.1 / 20 * t
    if t > T_max:
        return 1
    return 1 / (1 + np.exp(-k * (t - T_50)))

fig, axs = plt.subplots(1, 1, figsize=(10, 5))
probs = [(0.2, 2, 100), (0.2, 1, 90), (0.2, 0, 80)][::-1]
t = np.linspace(0, 120, 1000)
for p in probs:
    axs.plot(t, [probability_to_leave(ti, 120, p[2], p[0]) for ti in t], label=f'Επίπεδο Αιχμής: {p[1]}')

axs.set_xlabel('Χρόνος στάθμευσης (λεπτά)')
axs.set_ylabel('Πιθανότητα αποχώρησης')
axs.legend()
axs.grid()
fig.suptitle('Πιθανότητα αποχώρησης από τη θέση στάθμευσης', fontsize=16)
fig.savefig('Presentations/images/probability_to_leave.png')
plt.show()
    
